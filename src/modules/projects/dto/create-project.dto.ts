import { IsString, MinLength, IsOptional, IsArray } from 'class-validator';

export class CreateProjectDto {
  @IsString()
  @MinLength(3)
  name!: string;

  @IsOptional()
  @IsArray()
  features?: string[];
}
