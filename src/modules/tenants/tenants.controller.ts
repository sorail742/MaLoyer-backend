import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiNoContentResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import type { AuthenticatedUser } from '../../common/authenticated-user.interface';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';
import type { PaginatedResult } from '../../common/http/response.types';
import { CreateTenantDto } from './dto/create-tenant.dto';
import { TenantResponseDto } from './dto/tenant-response.dto';
import { UpdateTenantDto } from './dto/update-tenant.dto';
import { TenantsService } from './tenants.service';

@ApiTags('Tenants')
@ApiBearerAuth()
@Controller('tenants')
export class TenantsController {
  constructor(private readonly tenantsService: TenantsService) {}

  @Roles('owner', 'manager', 'accountant')
  @Get()
  @ApiOperation({ summary: 'Liste les locataires de l’organisation' })
  async list(
    @CurrentUser() user: AuthenticatedUser,
    @Query() pagination: PaginationQueryDto,
  ): Promise<PaginatedResult<TenantResponseDto>> {
    if (!user.organizationId) {
      throw new Error(
        'TenantScopeGuard aurait dû rejeter cette requête avant le controller',
      );
    }
    const result = await this.tenantsService.list(
      user.organizationId,
      pagination,
    );
    return {
      ...result,
      items: result.items.map((t) => TenantResponseDto.fromEntity(t)),
    };
  }

  @Roles('owner', 'manager', 'accountant')
  @Get(':id')
  @ApiOperation({ summary: 'Détails d’un locataire' })
  async findOne(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
  ): Promise<TenantResponseDto> {
    if (!user.organizationId) {
      throw new Error(
        'TenantScopeGuard aurait dû rejeter cette requête avant le controller',
      );
    }
    const tenant = await this.tenantsService.findByIdOrFail(
      id,
      user.organizationId,
    );
    return TenantResponseDto.fromEntity(tenant);
  }

  @Roles('owner', 'manager')
  @Post()
  @ApiOperation({ summary: 'Créer un locataire' })
  @ApiCreatedResponse({ type: TenantResponseDto })
  async create(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateTenantDto,
  ): Promise<TenantResponseDto> {
    if (!user.organizationId) {
      throw new Error(
        'TenantScopeGuard aurait dû rejeter cette requête avant le controller',
      );
    }
    const payload: CreateTenantDto = { fullName: dto.fullName };
    if (dto.phone !== undefined) payload.phone = dto.phone;
    if (dto.email !== undefined) payload.email = dto.email;
    if (dto.idDocumentRef !== undefined)
      payload.idDocumentRef = dto.idDocumentRef;
    if (dto.photoRef !== undefined) payload.photoRef = dto.photoRef;
    if (dto.emergencyContactName !== undefined)
      payload.emergencyContactName = dto.emergencyContactName;
    if (dto.emergencyContactPhone !== undefined)
      payload.emergencyContactPhone = dto.emergencyContactPhone;

    const tenant = await this.tenantsService.create(
      user.organizationId,
      payload,
    );
    return TenantResponseDto.fromEntity(tenant);
  }

  @Roles('owner', 'manager')
  @Patch(':id')
  @ApiOperation({ summary: 'Modifier un locataire' })
  @ApiOkResponse({ type: TenantResponseDto })
  async update(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: UpdateTenantDto,
  ): Promise<TenantResponseDto> {
    if (!user.organizationId) {
      throw new Error(
        'TenantScopeGuard aurait dû rejeter cette requête avant le controller',
      );
    }
    const payload: UpdateTenantDto = {};
    if (dto.fullName !== undefined) payload.fullName = dto.fullName;
    if (dto.phone !== undefined) payload.phone = dto.phone;
    if (dto.email !== undefined) payload.email = dto.email;
    if (dto.idDocumentRef !== undefined)
      payload.idDocumentRef = dto.idDocumentRef;
    if (dto.photoRef !== undefined) payload.photoRef = dto.photoRef;
    if (dto.emergencyContactName !== undefined)
      payload.emergencyContactName = dto.emergencyContactName;
    if (dto.emergencyContactPhone !== undefined)
      payload.emergencyContactPhone = dto.emergencyContactPhone;
    if (dto.isBlacklisted !== undefined)
      payload.isBlacklisted = dto.isBlacklisted;
    if (dto.blacklistReason !== undefined)
      payload.blacklistReason = dto.blacklistReason;

    const tenant = await this.tenantsService.update(
      id,
      user.organizationId,
      payload,
    );
    return TenantResponseDto.fromEntity(tenant);
  }

  @Roles('owner')
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Archiver un locataire (soft delete)' })
  @ApiNoContentResponse({ description: 'Locataire archivé (soft delete)' })
  async archive(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
  ): Promise<void> {
    if (!user.organizationId) {
      throw new Error(
        'TenantScopeGuard aurait dû rejeter cette requête avant le controller',
      );
    }
    await this.tenantsService.archive(id, user.organizationId);
  }
}
