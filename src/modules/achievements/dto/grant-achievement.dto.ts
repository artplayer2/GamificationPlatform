import { IsEnum, IsInt, IsOptional, IsString, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class GrantAchievementDto {
    @ApiProperty({ example: '66d2a2b3...' })
    @IsString()
    playerId!: string;

    @ApiProperty({ example: 'first_blood' })
    @IsString()
    code!: string;

    @ApiProperty({ example: '66d2a1f5...' })
    @IsString()
    projectId!: string;

    @ApiProperty({ enum: ['xp_threshold', 'counter_threshold'], example: 'xp_threshold' })
    @IsEnum(['xp_threshold', 'counter_threshold'])
    type!: 'xp_threshold' | 'counter_threshold';

    // xp_threshold
    @ApiPropertyOptional({ example: 1000, minimum: 0 })
    @IsOptional()
    @IsInt()
    @Min(0)
    minXp?: number;

    // counter_threshold
    @ApiPropertyOptional({ example: 'mob_kills' })
    @IsOptional()
    @IsString()
    counterName?: string;

    @ApiPropertyOptional({ example: 100, minimum: 1 })
    @IsOptional()
    @IsInt()
    @Min(1)
    counterMin?: number;
}
