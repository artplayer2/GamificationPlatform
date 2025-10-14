import { IsArray, IsBoolean, IsOptional, IsString, IsUrl, MinLength, ArrayNotEmpty } from 'class-validator';

export class CreateSubscriptionDto {
    @IsString()
    @MinLength(3)
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
    active?: boolean = true;
}
