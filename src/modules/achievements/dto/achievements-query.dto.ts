import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsMongoId, IsOptional, IsString, Max, Min } from 'class-validator';

export class AchievementsQueryDto {
    @ApiPropertyOptional({ description: 'Project ID', example: '66d2a1f5...' })
    @IsString()
    @IsMongoId()
    projectId!: string; // manteremos como obrigatório via controller

    @ApiPropertyOptional({ description: 'Filtrar por code', example: 'first_blood' })
    @IsOptional()
    @IsString()
    code?: string;

    @ApiPropertyOptional({ description: 'Cursor: itens ANTES deste _id', example: '66d2a9f1e4...' })
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
