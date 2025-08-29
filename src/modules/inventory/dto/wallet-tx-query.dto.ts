import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsMongoId, IsOptional, IsString, Max, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class WalletTxQueryDto {
    @ApiPropertyOptional({ description: 'Player ID', example: '66d2a2b3e4...' })
    @IsOptional()
    @IsString()
    @IsMongoId()
    playerId?: string;

    @ApiPropertyOptional({ description: 'Moeda (soft|hard)', example: 'soft' })
    @IsOptional()
    @IsString()
    currency?: 'soft' | 'hard';

    @ApiPropertyOptional({ description: 'Página: retornar itens ANTES deste ID (_id)', example: '66d2a9f1e4...' })
    @IsOptional()
    @IsString()
    @IsMongoId()
    after?: string;

    @ApiPropertyOptional({ description: 'Limite (1–100)', example: 20, default: 20 })
    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    @Max(100)
    limit?: number;
}
