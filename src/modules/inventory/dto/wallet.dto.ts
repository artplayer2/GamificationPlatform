import { IsEnum, IsInt, IsOptional, IsString, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class WalletOpDto {
    @ApiProperty({ example: '66d2a2b3e4...' })
    @IsString()
    playerId!: string;

    @ApiProperty({ enum: ['soft', 'hard'] })
    @IsEnum(['soft', 'hard'])
    currency!: 'soft' | 'hard';

    @ApiProperty({ example: 100, minimum: 1 })
    @Type(() => Number)
    @IsInt()
    @Min(1)
    amount!: number;

    @ApiProperty({ example: 'op-123456' })
    @IsString()
    idempotencyKey!: string;

    @ApiProperty({ example: 'purchase:small_pack', required: false })
    @IsOptional()
    @IsString()
    reason?: string;
}
