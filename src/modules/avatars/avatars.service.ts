import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { InjectModel } from '@nestjs/mongoose'
import { S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3'
import { Model } from 'mongoose'
import { Avatar, AvatarDocument } from './schemas/avatar.schema'
import { randomBytes } from 'crypto'
import { Request, Response } from 'express'
import { imageSize } from 'image-size'
import { Readable } from 'stream'

@Injectable()
export class AvatarsService {
  private s3: S3Client;
  private bucket: string;
  private allowedSizes: Array<{ w: number; h: number }>;
  private maxBytes: number;
  private allowedMime: Set<string>;

  constructor(
    private readonly config: ConfigService,
    @InjectModel(Avatar.name) private readonly model: Model<AvatarDocument>,
  ) {
    const endpoint = this.config.get<string>('S3_ENDPOINT');
    this.bucket = this.config.get<string>('S3_BUCKET')!;
    const region = this.config.get<string>('S3_REGION') || 'us-east-1';
    const forcePathStyle = this.config.get<string>('S3_FORCE_PATH_STYLE') === 'true';
    this.s3 = new S3Client({
      region,
      endpoint,
      forcePathStyle,
      credentials: {
        accessKeyId: this.config.get<string>('S3_ACCESS_KEY_ID')!,
        secretAccessKey: this.config.get<string>('S3_SECRET_ACCESS_KEY')!,
      },
    });

    // Allowed sizes (e.g., "128x128,256x256,512x512")
    const sizesEnv = this.config.get<string>('PLAYER_AVATAR_ALLOWED_SIZES') || '128x128,256x256,512x512';
    this.allowedSizes = sizesEnv.split(',').map((s) => {
      const [wStr, hStr] = s.trim().split('x');
      return { w: parseInt(wStr, 10), h: parseInt(hStr, 10) };
    });
    // Max size MB
    const maxMb = parseInt(this.config.get<string>('PLAYER_AVATAR_MAX_SIZE_MB') || '1', 10);
    this.maxBytes = maxMb * 1024 * 1024;
    // Allowed mime types
    const mimeEnv = this.config.get<string>('PLAYER_AVATAR_ALLOWED_MIME_TYPES') || 'image/png,image/jpeg,image/webp';
    this.allowedMime = new Set(mimeEnv.split(',').map((s) => s.trim()));
  }

  private genShortKey(): string {
    const raw = randomBytes(6).toString('base64url'); // ~8 chars
    return `av_${raw}`;
  }

  async uploadAvatar(tenantId: string, projectId: string, playerId: string, file: Express.Multer.File) {
    if (!file) throw new BadRequestException('File is required');
    if (!this.allowedMime.has(file.mimetype)) throw new BadRequestException('Unsupported content type');
    if (file.size > this.maxBytes) throw new BadRequestException('File too large');

    const dim = imageSize(file.buffer);
    if (!dim.width || !dim.height) throw new BadRequestException('Could not read image dimensions');
    const isAllowed = this.allowedSizes.some((s) => s.w === dim.width && s.h === dim.height);
    if (!isAllowed) throw new BadRequestException('Invalid avatar dimensions');

    const shortKey = this.genShortKey();
    const ext = file.mimetype === 'image/png' ? 'png' : file.mimetype === 'image/jpeg' ? 'jpg' : 'webp';
    const s3Key = `avatars/${shortKey}.${ext}`;

    await this.s3.send(new PutObjectCommand({
      Bucket: this.bucket,
      Key: s3Key,
      Body: file.buffer,
      ContentType: file.mimetype,
      CacheControl: 'public, max-age=31536000',
    }));

    // Remove previous avatar for player
    const prev = await this.model.findOne({ tenantId, projectId, playerId }).lean();
    if (prev) {
      try {
        await this.s3.send(new DeleteObjectCommand({ Bucket: this.bucket, Key: prev.s3Key }));
      } catch {}
      await this.model.deleteOne({ _id: prev._id }).exec();
    }

    const created = await this.model.create({
      tenantId,
      projectId,
      playerId,
      shortKey,
      s3Key,
      contentType: file.mimetype,
      sizeBytes: file.size,
      width: dim.width!,
      height: dim.height!,
    });

    // Return public route
    const urlPath = `/v1/public/avatars/${shortKey}`;
    return { shortKey, urlPath };
  }

  async streamPublic(req: Request, res: Response, shortKey: string) {
    const doc = await this.model.findOne({ shortKey }).lean().exec();
    if (!doc) throw new NotFoundException('Avatar not found');
    const obj = await this.s3.send(new GetObjectCommand({ Bucket: this.bucket, Key: doc.s3Key }));
    res.setHeader('Content-Type', doc.contentType);
    const body: any = obj.Body as any;
    if (body && typeof (body as Readable).pipe === 'function') {
      (body as Readable).pipe(res);
      return;
    }
    if (body && typeof body.arrayBuffer === 'function') {
      const buf = Buffer.from(await body.arrayBuffer());
      res.end(buf);
      return;
    }
    // Fallback: collect async iterable
    const chunks: Buffer[] = [];
    for await (const chunk of body) chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
    res.end(Buffer.concat(chunks));
  }
}