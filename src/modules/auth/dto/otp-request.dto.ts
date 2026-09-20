import { ApiProperty } from '@nestjs/swagger';
import { IsPhoneNumber } from 'class-validator';

export class OtpRequestDto {
  // Région fixée à la Guinée (ADR-0014) — un numéro valide mais étranger
  // (ex. +33...) est refusé, pas seulement mal formaté.
  @ApiProperty({ example: '+224620000000' })
  @IsPhoneNumber('GN')
  phone!: string;
}
