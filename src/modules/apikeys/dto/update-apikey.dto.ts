import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsDateString, IsInt, IsMongoId, IsOptional, IsString, Max, Min } from 'class-validator';

export class UpdateApiKeyDto {
  @ApiProperty({ description: 'New display name', required: false })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiProperty({ description: 'Update roles', required: false })
  @IsOptional()
  @IsArray()
  roles?: string[];

  @ApiProperty({ description: 'Update scopes', required: false })
  @IsOptional()
  @IsArray()
  scopes?: string[];

  @ApiProperty({ description: 'Update expiration (ISO)', required: false })
  @IsOptional()
  @IsDateString()
  expiresAt?: string;

  @ApiProperty({ description: 'Update per-min rate limit', required: false })
  @IsOptional()
  @IsInt()
  @Min(60)
  @Max(5000)
  rateLimitPerMin?: number;
}