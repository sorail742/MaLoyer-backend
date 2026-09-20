import { ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { IsBoolean, IsOptional, IsString } from 'class-validator';
import { CreateTenantDto } from './create-tenant.dto';

export class UpdateTenantDto extends PartialType(CreateTenantDto) {
  @ApiPropertyOptional({
    description: 'Indique si le locataire est sur liste noire',
  })
  @IsOptional()
  @IsBoolean()
  declare isBlacklisted?: boolean;

  @ApiPropertyOptional({ description: 'Raison de la mise sur liste noire' })
  @IsOptional()
  @IsString()
  declare blacklistReason?: string | null;
}
