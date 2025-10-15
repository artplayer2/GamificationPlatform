import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsDateString, IsInt, IsMongoId, IsOptional, IsString, Max, Min } from 'class-validator';

export class CreateApiKeyDto {
  @ApiProperty({ description: 'Display name for the key', example: 'Unity client key' })
  @IsString()
  name!: string;

  @ApiProperty({ description: 'Project ID this key belongs to', example: '64f0c2e3f1a2b3c4d5e6f7a8', required: false })
  @IsOptional()
  @IsMongoId()
  projectId?: string;

  @ApiProperty({ description: 'Roles assigned to this key', example: ['owner', 'developer'], required: false })
  @IsOptional()
  @IsArray()
  roles?: string[];

  @ApiProperty({ description: 'Scopes for access control', example: ['read:*', 'write:events'], required: false })
  @IsOptional()
  @IsArray()
  scopes?: string[];

  @ApiProperty({ description: 'Optional expiration date (ISO 8601)', required: false })
  @IsOptional()
  @IsDateString()
  expiresAt?: string;

  @ApiProperty({ description: 'Per-key rate limit (requests/min)', example: 600, required: false })
  @IsOptional()
  @IsInt()
  @Min(60)
  @Max(5000)
  rateLimitPerMin?: number;
}