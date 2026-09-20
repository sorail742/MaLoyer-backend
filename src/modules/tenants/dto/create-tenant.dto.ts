import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsPhoneNumber,
  IsString,
  MaxLength,
} from 'class-validator';
import { PHONE_REGION } from '../../../common/constants/locale';

export class CreateTenantDto {
  @ApiProperty({ description: 'Nom complet du locataire' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  declare fullName: string;

  @ApiPropertyOptional({ description: 'Numéro de téléphone' })
  @IsOptional()
  @IsPhoneNumber(PHONE_REGION)
  declare phone?: string;

  @ApiPropertyOptional({ description: 'Adresse email' })
  @IsOptional()
  @IsEmail()
  declare email?: string;

  @ApiPropertyOptional({ description: 'Contact en cas d’urgence (Nom)' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  declare emergencyContactName?: string;

  @ApiPropertyOptional({ description: 'Contact en cas d’urgence (Téléphone)' })
  @IsOptional()
  @IsPhoneNumber(PHONE_REGION)
  declare emergencyContactPhone?: string;

  // idDocumentRef et photoRef seront probablement gérés via des endpoints
  // d'upload séparés ou signés, mais on les inclut si jamais ils sont fournis
  @ApiPropertyOptional({ description: "Référence de la pièce d'identité" })
  @IsOptional()
  @IsString()
  declare idDocumentRef?: string;

  @ApiPropertyOptional({ description: 'Référence de la photo de profil' })
  @IsOptional()
  @IsString()
  declare photoRef?: string;
}
