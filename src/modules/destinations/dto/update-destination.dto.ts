import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, ArrayNotEmpty, IsBoolean, IsIn, IsOptional, IsString, IsUrl, MinLength } from 'class-validator';

export class UpdateDestinationDto {
    @ApiPropertyOptional({
        description: 'Destination type',
        example: 'webhook',
        enum: ['webhook', 'websocket'],
    })
    @IsOptional()
    @IsIn(['webhook', 'websocket'])
    type?: 'webhook' | 'websocket';

    @ApiPropertyOptional({
        description: 'Updated event types',
        example: ['*'],
    })
    @IsOptional()
    @IsArray()
    @ArrayNotEmpty()
    @IsString({ each: true })
    eventTypes?: string[];

    @ApiPropertyOptional({
        description: 'Enable or disable the destination',
        example: false,
    })
    @IsOptional()
    @IsBoolean()
    active?: boolean;

    @ApiPropertyOptional({
        description: 'Webhook URL (if applicable)',
        example: 'https://myserver.com/webhooks/receive',
    })
    @IsOptional()
    @IsUrl({ require_tld: false, require_protocol: true })
    url?: string;

    @ApiPropertyOptional({
        description: 'Secret used for HMAC signature',
        example: 'super_secret_key_123456',
    })
    @IsOptional()
    @IsString()
    @MinLength(16)
    secret?: string;
}
