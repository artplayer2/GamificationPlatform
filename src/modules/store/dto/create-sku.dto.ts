import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsInt, IsMongoId, IsOptional, IsString, Min, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

class SkuItemDto {
    @ApiProperty({ example: 'potion_small' })
    @IsString()
    code!: string;

    @ApiProperty({ example: 1, minimum: 1 })
    @Type(() => Number)
    @IsInt()
    @Min(1)
    qty!: number;
}

export class CreateSkuDto {
    @ApiProperty({ example: '66d2a1f5e4aabbccddeeff00' })
    @IsString()
    @IsMongoId({ message: 'projectId must be a valid ObjectId' })
    projectId!: string;

    @ApiProperty({ example: 'bundle_potions_small' })
    @IsString()
    code!: string; // único por projeto

    @ApiProperty({ example: 'Small Potions Pack' })
    @IsString()
    title!: string;

    @ApiPropertyOptional({ example: 'Get 3 small potions at a discount' })
    @IsOptional()
    @IsString()
    description?: string;

    @ApiPropertyOptional({ example: 300, minimum: 0, description: 'Preço em soft' })
    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(0)
    priceSoft?: number;

    @ApiPropertyOptional({ example: 1, minimum: 0, description: 'Preço em hard' })
    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(0)
    priceHard?: number;

    @ApiProperty({
        description: 'Itens concedidos pela compra',
        type: [SkuItemDto],
        example: [{ code: 'potion_small', qty: 3 }],
    })
    @ValidateNested({ each: true })
    @Type(() => SkuItemDto)
    items!: SkuItemDto[];

    @ApiPropertyOptional({ example: 'https://cdn.example.com/store/bundle.png' })
    @IsOptional()
    @IsString()
    imageUrl?: string;
}
