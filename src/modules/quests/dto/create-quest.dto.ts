import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsInt, IsMongoId, IsObject, IsOptional, IsString, Min, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

class RewardItemDto {
    @ApiProperty({ example: 'potion_small' })
    @IsString()
    code!: string;

    @ApiProperty({ example: 2, minimum: 1 })
    @Type(() => Number)
    @IsInt()
    @Min(1)
    qty!: number;
}

export class CreateQuestDto {
    @ApiProperty({ example: '66d2a1f5e4aabbccddeeff00' })
    @IsString()
    @IsMongoId({ message: 'projectId must be a valid ObjectId' })
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

    @ApiPropertyOptional({
        description: 'Itens de recompensa',
        type: [RewardItemDto],
        example: [{ code: 'potion_small', qty: 2 }],
    })
    @IsOptional()
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => RewardItemDto)
    rewardItems?: RewardItemDto[];

    @ApiPropertyOptional({ example: { season: 1 } })
    @IsOptional()
    @IsObject()
    metadata?: Record<string, any>;
}
