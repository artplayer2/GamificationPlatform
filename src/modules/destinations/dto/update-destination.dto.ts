import { IsArray, ArrayNotEmpty, IsBoolean, IsIn, IsMongoId, IsOptional, IsString, IsUrl, MinLength } from 'class-validator';

export class UpdateDestinationDto {
    @IsOptional() @IsIn(['webhook','websocket'])
    type?: 'webhook' | 'websocket';

    @IsOptional() @IsArray() @ArrayNotEmpty() @IsString({ each: true })
    eventTypes?: string[];

    @IsOptional() @IsBoolean()
    active?: boolean;

    @IsOptional() @IsUrl({ require_tld: false, require_protocol: true })
    url?: string;

    @IsOptional() @IsString() @MinLength(16)
    secret?: string;
}
