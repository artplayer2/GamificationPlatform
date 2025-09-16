import {
    ArgumentsHost,
    Catch,
    ExceptionFilter,
    HttpException,
    HttpStatus,
} from '@nestjs/common';
import { Request, Response } from 'express';

// Mongoose error shapes (parciais)
type MongoServerError = { code?: number; keyValue?: any; message?: string };
type MongooseCastError = { name: 'CastError'; path?: string; value?: any; message?: string };

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
    catch(exception: any, host: ArgumentsHost) {
        const ctx     = host.switchToHttp();
        const res     = ctx.getResponse<Response>();
        const req     = ctx.getRequest<Request>();
        const isHttp  = exception instanceof HttpException;

        let status: number;
        let title: string;
        let detail: string | undefined;
        let type = 'about:blank';

        if (isHttp) {
            status = (exception as HttpException).getStatus();
            const resp: any = (exception as HttpException).getResponse();
            // resp pode ser string ou objeto
            title  = typeof resp === 'string' ? resp : resp?.error || exception.name || 'Error';
            detail = typeof resp === 'string' ? undefined : resp?.message;
            if (Array.isArray(detail)) detail = detail.join('; ');
        } else {
            // Mongoose CastError (ObjectId inválido)
            if (exception?.name === 'CastError') {
                const cast = exception as MongooseCastError;
                status = HttpStatus.BAD_REQUEST;
                title  = 'Invalid identifier';
                detail = cast.path
                    ? `Invalid value for "${cast.path}"`
                    : 'Invalid ObjectId format';
                type   = 'https://httpstatuses.com/400';
            }
            // Duplicate key (Mongo 11000)
            else if (typeof exception?.code === 'number' && exception.code === 11000) {
                status = HttpStatus.CONFLICT;
                title  = 'Duplicate key';
                const keys = (exception as MongoServerError).keyValue
                    ? Object.keys((exception as MongoServerError).keyValue).join(', ')
                    : undefined;
                detail = keys ? `A record with the same ${keys} already exists.` : 'Duplicate key error.';
                type   = 'https://httpstatuses.com/409';
            }
            // Fallback
            else {
                status = HttpStatus.INTERNAL_SERVER_ERROR;
                title  = exception?.name || 'Internal Server Error';
                detail = process.env.NODE_ENV === 'production'
                    ? undefined
                    : (exception?.message || 'Unexpected error');
                type   = 'https://httpstatuses.com/500';
            }
        }

        const problem = {
            type,
            title,
            status,
            detail,
            instance: req.originalUrl,
            // útil para debug (não exibe stack em produção)
            ...(process.env.NODE_ENV !== 'production' && exception?.stack
                ? { stack: exception.stack.split('\n').slice(0, 5) }
                : {}),
        };

        res
            .status(status)
            .setHeader('Content-Type', 'application/problem+json')
            .json(problem);
    }
}
