import { IsInt, Min, IsString } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class AwardXpDto {
    @ApiProperty({ example: '66d2a2b3e4...' })
    @IsString()
    playerId!: string;

    @ApiProperty({ example: 250, minimum: 1 })
    @Type(() => Number)
    @IsInt()
    @Min(1)
    amount!: number;

    @ApiProperty({ example: 'quest:starter' })
    @IsString()
    reason!: string;

    @ApiProperty({ example: 'xp-00001-abc' })
    @IsString()
    idempotencyKey!: string;
}
