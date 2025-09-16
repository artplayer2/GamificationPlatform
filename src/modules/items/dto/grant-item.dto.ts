import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsMongoId, IsOptional, IsString, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class GrantItemDto {
    @ApiProperty({ example: '66d2a1f5e4aabbccddeeff00' })
    @IsString()
    @IsMongoId({ message: 'projectId must be a valid ObjectId' })
    projectId!: string;

    @ApiProperty({ example: 'potion_small' })
    @IsString()
    code!: string;

    @ApiProperty({ example: '66d2b3c4e4aabbccddeeff11' })
    @IsString()
    @IsMongoId({ message: 'playerId must be a valid ObjectId' })
    playerId!: string;

    @ApiProperty({ example: 3, minimum: 1 })
    @Type(() => Number)
    @IsInt()
    @Min(1)
    qty!: number;

    @ApiProperty({ example: 'item-grant-001' })
    @IsString()
    idempotencyKey!: string;

    @ApiPropertyOptional({ example: 'quest_reward' })
    @IsOptional()
    @IsString()
    reason?: string;
}
