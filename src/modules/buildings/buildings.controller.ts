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
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiNoContentResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import type { AuthenticatedUser } from '../../common/authenticated-user.interface';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';
import { RolesGuard } from '../../common/guards/roles.guard';
import { TenantScopeGuard } from '../../common/guards/tenant-scope.guard';
import type { PaginatedResult } from '../../common/http/response.types';
import { BuildingsService } from './buildings.service';
import { BuildingResponseDto } from './dto/building-response.dto';
import { CreateBuildingDto } from './dto/create-building.dto';
import { UpdateBuildingDto } from './dto/update-building.dto';

/**
 * `JwtAuthGuard` est global — pas besoin de le redéclarer.
 * `TenantScopeGuard` + `RolesGuard` sur toutes les routes : les immeubles
 * sont des ressources tenant-scopées (ADR-0002).
 */
@ApiTags('buildings')
@ApiBearerAuth()
@UseGuards(TenantScopeGuard, RolesGuard)
@Controller('buildings')
export class BuildingsController {
  constructor(private readonly buildingsService: BuildingsService) {}

  @Roles('owner', 'manager', 'accountant')
  @Get()
  @ApiOperation({
    summary: "Liste les immeubles de l'organisation",
    description:
      "Un manager ne voit que ses immeubles assignés (ADR-0013). Un owner ou accountant voit tous les immeubles de l'organisation.",
  })
  async list(
    @CurrentUser() user: AuthenticatedUser,
    @Query() pagination: PaginationQueryDto,
  ): Promise<PaginatedResult<BuildingResponseDto>> {
    if (!user.organizationId) {
      throw new Error(
        'TenantScopeGuard aurait dû rejeter cette requête avant le controller',
      );
    }
    const result = await this.buildingsService.list(
      user.organizationId,
      user.role,
      user.userId,
      { page: pagination.page, limit: pagination.limit },
    );
    return {
      ...result,
      items: result.items.map((b) => BuildingResponseDto.fromEntity(b)),
    };
  }

  @Roles('owner', 'manager', 'accountant')
  @Get(':id')
  async findOne(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
  ): Promise<BuildingResponseDto> {
    if (!user.organizationId) {
      throw new Error(
        'TenantScopeGuard aurait dû rejeter cette requête avant le controller',
      );
    }
    const building = await this.buildingsService.findByIdOrFail(
      id,
      user.organizationId,
      user.role,
      user.userId,
    );
    return BuildingResponseDto.fromEntity(building);
  }

  @Roles('owner')
  @Post()
  async create(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateBuildingDto,
  ): Promise<BuildingResponseDto> {
    if (!user.organizationId) {
      throw new Error(
        'TenantScopeGuard aurait dû rejeter cette requête avant le controller',
      );
    }
    const building = await this.buildingsService.create(user.organizationId, {
      name: dto.name,
      address: dto.address,
      city: dto.city,
      ...(dto.floorsCount !== undefined && { floorsCount: dto.floorsCount }),
      ...(dto.photos !== undefined && { photos: dto.photos }),
    });
    return BuildingResponseDto.fromEntity(building);
  }

  @Roles('owner')
  @Patch(':id')
  async update(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: UpdateBuildingDto,
  ): Promise<BuildingResponseDto> {
    if (!user.organizationId) {
      throw new Error(
        'TenantScopeGuard aurait dû rejeter cette requête avant le controller',
      );
    }
    const building = await this.buildingsService.update(
      id,
      user.organizationId,
      {
        ...(dto.name !== undefined && { name: dto.name }),
        ...(dto.address !== undefined && { address: dto.address }),
        ...(dto.city !== undefined && { city: dto.city }),
        ...(dto.floorsCount === null
          ? { floorsCount: null }
          : dto.floorsCount !== undefined
            ? { floorsCount: dto.floorsCount }
            : {}),
        ...(dto.photos !== undefined && { photos: dto.photos }),
      },
    );
    return BuildingResponseDto.fromEntity(building);
  }

  @Roles('owner')
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiNoContentResponse({ description: 'Immeuble archivé (soft delete)' })
  async archive(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
  ): Promise<void> {
    if (!user.organizationId) {
      throw new Error(
        'TenantScopeGuard aurait dû rejeter cette requête avant le controller',
      );
    }
    await this.buildingsService.archive(id, user.organizationId);
  }

  // ── Gestion des gestionnaires délégués (ADR-0013) ──────────────────────────

  @Roles('owner')
  @Post(':id/managers/:userId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiNoContentResponse({ description: "Gestionnaire assigné à l'immeuble" })
  async assignManager(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Param('userId') userId: string,
  ): Promise<void> {
    if (!user.organizationId) {
      throw new Error(
        'TenantScopeGuard aurait dû rejeter cette requête avant le controller',
      );
    }
    await this.buildingsService.assignManager(id, user.organizationId, userId);
  }

  @Roles('owner')
  @Delete(':id/managers/:userId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiNoContentResponse({ description: "Gestionnaire retiré de l'immeuble" })
  async removeManager(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Param('userId') userId: string,
  ): Promise<void> {
    if (!user.organizationId) {
      throw new Error(
        'TenantScopeGuard aurait dû rejeter cette requête avant le controller',
      );
    }
    await this.buildingsService.removeManager(id, user.organizationId, userId);
  }
}
