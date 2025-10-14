import { IsArray, IsBoolean, IsIn, IsInt, IsMongoId, IsOptional, IsString, IsISO8601 } from 'class-validator';
import { Type } from 'class-transformer';

export class RedriveDeliveriesDto {
    // 1) Redrive direto por uma lista de IDs
    @IsOptional() @IsArray()
    @IsMongoId({ each: true })
    ids?: string[];

    // 2) OU redrive por filtros (mutuamente com ids; se ambos vierem, ids prevalecem)
    @IsOptional() @IsMongoId()
    projectId?: string;

    @IsOptional() @IsMongoId()
    subscriptionId?: string;

    @IsOptional() @IsString()
    eventType?: string;

    @IsOptional() @IsIn(['pending','delivered','dead'])
    status?: 'pending' | 'delivered' | 'dead';

    @IsOptional() @IsISO8601()
    after?: string;

    @IsOptional() @IsISO8601()
    before?: string;

    @IsOptional() @Type(() => Number) @IsInt()
    limit?: number; // limite do batch quando usar filtros

    // Opções
    @IsOptional() @IsBoolean()
    resetAttempts?: boolean; // default false

    @IsOptional() @IsBoolean()
    onlyFailedOrDead?: boolean; // default true (ignora delivered)
}
