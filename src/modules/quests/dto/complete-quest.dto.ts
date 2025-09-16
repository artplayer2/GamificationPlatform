import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsObject, IsMongoId } from 'class-validator';

export class CompleteQuestDto {
    @ApiProperty({ example: '66d2a1f5e4aabbccddeeff00' })
    @IsString()
    @IsMongoId({ message: 'projectId must be a valid ObjectId' })
    projectId!: string;

    @ApiProperty({ example: 'quest-00001-a' })
    @IsString()
    idempotencyKey!: string;

    @ApiPropertyOptional({ example: { source: 'mission_board' } })
    @IsOptional()
    @IsObject()
    context?: Record<string, any>;
}
