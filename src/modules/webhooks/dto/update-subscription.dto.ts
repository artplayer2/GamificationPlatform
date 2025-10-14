import { IsArray, IsBoolean, IsOptional, IsString, IsUrl, MinLength, ArrayNotEmpty } from 'class-validator';

export class UpdateSubscriptionDto {
    @IsOptional()
    @IsUrl({ require_tld: false, require_protocol: true })
    url?: string;

    @IsOptional()
    @IsString()
    @MinLength(16)
    secret?: string;

    @IsOptional()
    @IsArray()
    @ArrayNotEmpty()
    @IsString({ each: true })
    eventTypes?: string[];

    @IsOptional()
    @IsBoolean()
    active?: boolean;
}
