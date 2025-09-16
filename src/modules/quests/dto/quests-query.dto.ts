import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsMongoId, IsOptional, IsString, IsInt, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

export class QuestsQueryDto {
    @ApiProperty({ description: 'Project ID', example: '66d2a1f5e4...' })
    @IsString()
    @IsMongoId()
    projectId!: string; // obrigatório

    @ApiPropertyOptional({ description: 'Filtrar por code', example: 'q_first_steps' })
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
