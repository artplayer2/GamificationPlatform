import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsString, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class IncrementCounterDto {
    @ApiProperty({ example: '66d2a2b3...' })
    @IsString()
    playerId!: string;

    @ApiProperty({ example: '66d2a1f5...' })
    @IsString()
    projectId!: string;

    @ApiProperty({ example: 'mob_kills' })
    @IsString()
    name!: string;

    @ApiProperty({ example: 1, minimum: 1 })
    @Type(() => Number)
    @IsInt()
    @Min(1)
    amount!: number;
}
