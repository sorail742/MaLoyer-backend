import { ApiProperty } from '@nestjs/swagger';
import { IsPhoneNumber } from 'class-validator';

export class OtpRequestDto {
  @ApiProperty({ example: '+224620000000' })
  @IsPhoneNumber()
  phone!: string;
}
