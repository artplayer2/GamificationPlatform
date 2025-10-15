import { IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreatePlayerDto {
  @ApiProperty({ description: 'Target project ObjectId', example: '66d2a1f5e4aabbccddeeff00' })
  @IsString()
  projectId!: string;

  @ApiProperty({ description: 'Unique player username', example: 'the_wizard_77', minLength: 3 })
  @IsString()
  @MinLength(3)
  username!: string;
}
