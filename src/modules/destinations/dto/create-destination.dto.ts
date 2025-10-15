import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, ArrayNotEmpty, IsBoolean, IsIn, IsMongoId, IsOptional, IsString, IsUrl, MinLength } from 'class-validator';

export class CreateDestinationDto {
    @ApiProperty({
        description: 'Project ID that owns this destination',
        example: '66fd43a849b820102950f6f5',
    })
    @IsMongoId()
    projectId!: string;

    @ApiProperty({
        description: 'Destination type',
        example: 'webhook',
        enum: ['webhook', 'websocket'],
    })
    @IsIn(['webhook', 'websocket'])
    type!: 'webhook' | 'websocket';

    @ApiProperty({
        description: 'List of event types to listen to. Use ["*"] for all.',
        example: ['player.xp.added', 'quest.completed'],
        type: [String],
    })
    @IsArray()
    @ArrayNotEmpty()
    @IsString({ each: true })
    eventTypes!: string[];

    @ApiPropertyOptional({
        description: 'Whether the destination is active',
        example: true,
    })
    @IsOptional()
    @IsBoolean()
    active?: boolean = true;

    @ApiPropertyOptional({
        description: 'Webhook URL (required if type=webhook)',
        example: 'https://myserver.com/webhooks/receive',
    })
    @IsOptional()
    @IsUrl({ require_tld: false, require_protocol: true })
    url?: string;

    @ApiPropertyOptional({
        description: 'Secret used to sign webhook requests (min 16 chars)',
        example: 'super_secret_key_123456',
    })
    @IsOptional()
    @IsString()
    @MinLength(16)
    secret?: string;
}
