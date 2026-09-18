import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, MinLength } from 'class-validator';

/**
 * Connexion email + mot de passe — propriétaire, gestionnaire, comptable,
 * super admin (cahier des charges §6.4, §9.2). Le locataire utilise le
 * parcours OTP (`otp-request.dto.ts` / `otp-verify.dto.ts`).
 */
export class LoginDto {
  @ApiProperty()
  @IsEmail()
  email!: string;

  @ApiProperty()
  @IsString()
  @MinLength(8)
  password!: string;
}
