import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, MinLength } from 'class-validator';

/**
 * Inscription du compte principal d'une organisation — cahier des charges
 * §4 "Propriétaire / Gérant d'organisation... compte principal d'une
 * organisation". Crée l'`Organization` (statut `trialing`) et son premier
 * `User` (rôle `owner`) en une seule opération.
 */
export class RegisterDto {
  @ApiProperty({ example: 'Immeubles Konimodou' })
  @IsString()
  @MinLength(2)
  organizationName!: string;

  @ApiProperty({ example: 'Mariam Diallo' })
  @IsString()
  @MinLength(2)
  fullName!: string;

  @ApiProperty({ example: 'mariam.diallo@example.com' })
  @IsEmail()
  email!: string;

  @ApiProperty({ minLength: 8 })
  @IsString()
  @MinLength(8)
  password!: string;
}
