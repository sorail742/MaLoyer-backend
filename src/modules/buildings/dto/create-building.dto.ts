import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsInt,
  IsOptional,
  IsString,
  Min,
  MinLength,
} from 'class-validator';

export class CreateBuildingDto {
  @ApiProperty({ example: 'Résidence Les Manguiers' })
  @IsString()
  @MinLength(2)
  declare name: string;

  @ApiProperty({ example: 'Avenue de la République, Commune de Matam' })
  @IsString()
  @MinLength(5)
  declare address: string;

  @ApiProperty({ example: 'Conakry' })
  @IsString()
  @MinLength(2)
  declare city: string;

  @ApiPropertyOptional({ example: 5 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  floorsCount?: number;

  @ApiPropertyOptional({
    type: [String],
    description:
      'Références de stockage des photos (pas les fichiers eux-mêmes)',
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  photos?: string[];
}
