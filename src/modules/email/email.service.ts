import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';

export interface EmailProviderLike {
  send(to: string, subject: string, html: string): Promise<void>;
}

class ConsoleProvider implements EmailProviderLike {
  async send(to: string, subject: string, html: string): Promise<void> {
    // eslint-disable-next-line no-console
    console.log('[EMAIL:console]', { to, subject, preview: html.slice(0, 120) + '...' });
  }
}

class ResendProvider implements EmailProviderLike {
  constructor(private readonly apiKey: string, private readonly from: string) {}
  async send(to: string, subject: string, html: string): Promise<void> {
    await axios.post('https://api.resend.com/emails', { from: this.from, to, subject, html }, {
      headers: { Authorization: `Bearer ${this.apiKey}` }
    });
  }
}

@Injectable()
export class EmailService {
  private readonly provider: EmailProviderLike;
  private readonly from: string;
  private readonly logger = new Logger(EmailService.name);

  constructor() {
    this.from = process.env.EMAIL_FROM ?? 'noreply@example.com';
    const provider = (process.env.EMAIL_PROVIDER ?? 'console').toLowerCase();
    if (provider === 'resend') {
      const apiKey = process.env.RESEND_API_KEY ?? '';
      if (!apiKey) {
        this.logger.warn('RESEND_API_KEY missing, falling back to console provider');
        this.provider = new ConsoleProvider();
      } else {
        this.provider = new ResendProvider(apiKey, this.from);
      }
    } else {
      this.provider = new ConsoleProvider();
    }
  }

  async sendClientVerifyEmail(tenantCode: string, email: string, token: string) {
    const subject = `[${tenantCode}] Verifique seu e-mail`;
    const verifyUrl = `${process.env.PUBLIC_URL ?? 'http://localhost:3000'}/verify?tenant=${encodeURIComponent(tenantCode)}&email=${encodeURIComponent(email)}&token=${encodeURIComponent(token)}`;
    const html = this.renderHtml('client-verify', { tenantCode, email, token, verifyUrl });
    await this.provider.send(email, subject, html);
  }

  async sendClientResetEmail(tenantCode: string, email: string, token: string) {
    const subject = `[${tenantCode}] Reset de senha`;
    const resetUrl = `${process.env.PUBLIC_URL ?? 'http://localhost:3000'}/reset?tenant=${encodeURIComponent(tenantCode)}&email=${encodeURIComponent(email)}&token=${encodeURIComponent(token)}`;
    const html = this.renderHtml('client-reset', { tenantCode, email, token, resetUrl });
    await this.provider.send(email, subject, html);
  }

  // TODO: Player verify/reset endpoints in later checklist step

  private renderHtml(template: 'client-verify' | 'client-reset', vars: Record<string,string>) {
    if (template === 'client-verify') {
      return `<!doctype html><html><body style="font-family: Arial, sans-serif;">
        <h2>Verifique seu e-mail</h2>
        <p>Olá,</p>
        <p>Recebemos um pedido para verificar o e-mail <strong>${this.escape(vars.email)}</strong> no tenant <strong>${this.escape(vars.tenantCode)}</strong>.</p>
        <p>Clique no botão abaixo para confirmar:</p>
        <p><a href="${this.escape(vars.verifyUrl)}" style="display:inline-block;padding:10px 16px;background:#4f46e5;color:#fff;text-decoration:none;border-radius:6px">Verificar e-mail</a></p>
        <p>Se você não solicitou isso, ignore este e-mail.</p>
      </body></html>`;
    }
    // client-reset
    return `<!doctype html><html><body style="font-family: Arial, sans-serif;">
      <h2>Reset de senha</h2>
      <p>Olá,</p>
      <p>Recebemos um pedido para redefinir a senha do e-mail <strong>${this.escape(vars.email)}</strong> no tenant <strong>${this.escape(vars.tenantCode)}</strong>.</p>
      <p>Clique no botão abaixo para criar uma nova senha:</p>
      <p><a href="${this.escape(vars.resetUrl)}" style="display:inline-block;padding:10px 16px;background:#4f46e5;color:#fff;text-decoration:none;border-radius:6px">Resetar senha</a></p>
      <p>Se você não solicitou isso, ignore este e-mail.</p>
    </body></html>`;
  }

  private escape(s: string) {
    return s.replace(/[&<>\"]/g, (c) => ({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;'} as any)[c]);
  }
}