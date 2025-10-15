import { IsArray, ArrayNotEmpty, IsBoolean, IsIn, IsMongoId, IsOptional, IsString, IsUrl, MinLength } from 'class-validator';

export class CreateDestinationDto {
    @IsMongoId()
    projectId!: string;

    @IsIn(['webhook','websocket'])
    type!: 'webhook' | 'websocket';

    @IsArray() @ArrayNotEmpty() @IsString({ each: true })
    eventTypes!: string[]; // ["*"] ou lista específica

    @IsOptional() @IsBoolean()
    active?: boolean = true;

    // Campos específicos de webhook (opcionais no create quando type=websocket)
    @IsOptional() @IsUrl({ require_tld: false, require_protocol: true })
    url?: string;

    @IsOptional() @IsString() @MinLength(16)
    secret?: string;
}
