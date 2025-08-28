import { IsString, MinLength } from 'class-validator';

export class CreatePlayerDto {
  @IsString()
  projectId!: string;

  @IsString()
  @MinLength(3)
  username!: string;
}
