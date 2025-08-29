import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, ArrayMinSize, IsBoolean, IsOptional, IsString } from 'class-validator';

export class CreateCurveDto {
    @ApiProperty({ example: '66d2a1f5...' })
    @IsString()
    projectId!: string;

    @ApiProperty({ example: 'Default Linear x1000' })
    @IsString()
    name!: string;

    @ApiProperty({ example: [0, 1000, 2000, 3000] })
    @IsArray()
    @ArrayMinSize(1)
    levels!: number[];

    @ApiPropertyOptional({ example: true })
    @IsOptional()
    @IsBoolean()
    isActive?: boolean;
}
