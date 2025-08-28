import { IsInt, Min, IsString } from 'class-validator';

export class AwardXpDto {
  @IsString()
  playerId!: string;

  @IsInt()
  @Min(1)
  amount!: number;

  @IsString()
  reason!: string;
}
