import { IsIn, IsInt, IsMongoId, IsOptional, IsString, IsISO8601 } from 'class-validator';
import { Type } from 'class-transformer';

export class ListDeliveriesDto {
    @IsOptional() @IsMongoId()
    projectId?: string;

    @IsOptional() @IsMongoId()
    subscriptionId?: string;

    @IsOptional() @IsString()
    eventType?: string;

    @IsOptional() @IsIn(['pending','delivered','dead'])
    status?: 'pending' | 'delivered' | 'dead';

    @IsOptional() @IsISO8601()
    after?: string; // createdAt >=

    @IsOptional() @IsISO8601()
    before?: string; // createdAt <=

    @IsOptional() @IsString()
    cursor?: string; // paginação (id)

    @IsOptional() @Type(() => Number) @IsInt()
    limit?: number; // default 50 (max 200)
}
