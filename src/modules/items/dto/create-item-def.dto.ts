import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsMongoId, IsOptional, IsString } from 'class-validator';

export class CreateItemDefDto {
    @ApiProperty({ example: '66d2a1f5e4aabbccddeeff00' })
    @IsString()
    @IsMongoId({ message: 'projectId must be a valid ObjectId' })
    projectId!: string;

    @ApiProperty({ example: 'potion_small' })
    @IsString()
    code!: string; // único por projeto

    @ApiProperty({ example: 'Small Potion' })
    @IsString()
    name!: string;

    @ApiPropertyOptional({ example: 'Restores 50 HP' })
    @IsOptional()
    @IsString()
    description?: string;

    @ApiPropertyOptional({ example: true, description: 'Se pode empilhar' })
    @IsOptional()
    @IsBoolean()
    stackable?: boolean;

    @ApiPropertyOptional({ example: 'consumable' })
    @IsOptional()
    @IsString()
    type?: string; // consumable, cosmetic, key, resource, etc.

    @ApiPropertyOptional({ example: 'https://cdn.example.com/items/potion_small.png' })
    @IsOptional()
    @IsString()
    imageUrl?: string;
}
