import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsObject, IsOptional, IsString, Min } from 'class-validator';

export class CreateQuestDto {
    @ApiProperty({ example: '66d2a1f5...' })
    @IsString()
    projectId!: string;

    @ApiProperty({ example: 'q_first_steps' })
    @IsString()
    code!: string;

    @ApiProperty({ example: 'Primeiros Passos' })
    @IsString()
    title!: string;

    @ApiPropertyOptional({ example: 'Complete o tutorial' })
    @IsOptional()
    @IsString()
    description?: string;

    @ApiPropertyOptional({ example: 500, minimum: 0 })
    @IsOptional()
    @IsInt()
    @Min(0)
    rewardXp?: number;

    @ApiPropertyOptional({ example: 100, minimum: 0 })
    @IsOptional()
    @IsInt()
    @Min(0)
    rewardSoft?: number;

    @ApiPropertyOptional({ example: 5, minimum: 0 })
    @IsOptional()
    @IsInt()
    @Min(0)
    rewardHard?: number;

    @ApiPropertyOptional({ example: { season: 1 } })
    @IsOptional()
    @IsObject()
    metadata?: Record<string, any>;
}
