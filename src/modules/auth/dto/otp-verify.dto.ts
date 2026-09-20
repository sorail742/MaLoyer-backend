import { ApiProperty } from '@nestjs/swagger';
import { IsPhoneNumber, IsString, Length } from 'class-validator';

export class OtpVerifyDto {
  // Région fixée à la Guinée (ADR-0014).
  @ApiProperty({ example: '+224620000000' })
  @IsPhoneNumber('GN')
  phone!: string;

  @ApiProperty({ example: '482913' })
  @IsString()
  @Length(4, 8)
  code!: string;
}
