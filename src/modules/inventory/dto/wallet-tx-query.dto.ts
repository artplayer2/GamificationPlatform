import { IsIn, IsInt, IsMongoId, IsOptional, IsPositive, IsString, IsISO8601 } from 'class-validator';
import { Type } from 'class-transformer';

export class WalletTxQueryDto {
    @IsOptional() @IsMongoId()
    playerId?: string;

    @IsOptional() @IsString()
    currency?: string;

    @IsOptional() @IsIn(['credit','debit'])
    type?: 'credit' | 'debit';

    @IsOptional() @IsISO8601()
    after?: string;

    @IsOptional() @IsISO8601()
    before?: string;

    @IsOptional() @IsString()
    cursor?: string;

    @IsOptional() @Type(() => Number) @IsInt() @IsPositive()
    limit?: number;
}
