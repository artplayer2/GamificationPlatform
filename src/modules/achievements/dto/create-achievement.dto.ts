import { IsEnum, IsInt, IsOptional, IsString, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateAchievementDto {
    @ApiProperty({ example: 'first_blood' })
    @IsString()
    code!: string;

    @ApiProperty({ example: 'First Blood' })
    @IsString()
    title!: string;

    @ApiPropertyOptional({ example: 'Earn 1000 XP' })
    @IsOptional()
    @IsString()
    description?: string;

    @ApiPropertyOptional({ example: 'https://cdn.example.com/achievements/first_blood.png' })
    @IsOptional()
    @IsString()
    imageUrl?: string;

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

    @ApiProperty({ example: '66d2a1f5e4...' })
    @IsString()
    projectId!: string;
}
