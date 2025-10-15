import { IsArray, IsBoolean, IsString, IsUrl, MinLength, ArrayNotEmpty, IsOptional, IsMongoId } from 'class-validator';

export class CreateSubscriptionDto {
    @IsMongoId()
    projectId!: string;

    @IsUrl({ require_tld: false, require_protocol: true })
    url!: string;

    @IsString()
    @MinLength(16)
    secret!: string;

    @IsArray()
    @ArrayNotEmpty()
    @IsString({ each: true })
    eventTypes!: string[];

    @IsOptional()
    @IsBoolean()
    // active é opcional; se omitido, assume true no service
    active?: boolean;
}