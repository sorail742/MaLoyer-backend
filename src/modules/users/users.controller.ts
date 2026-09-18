import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import type { AuthenticatedUser } from '../../common/authenticated-user.interface';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';
import { RolesGuard } from '../../common/guards/roles.guard';
import { TenantScopeGuard } from '../../common/guards/tenant-scope.guard';
import type { PaginatedResult } from '../../common/http/response.types';
import { UserResponseDto } from './dto/user-response.dto';
import { UsersService } from './users.service';

@ApiTags('users')
@ApiBearerAuth()
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  // Pas de TenantScopeGuard/RolesGuard : lecture de son propre profil,
  // ouverte à tout rôle authentifié (y compris super_admin, sans
  // organisation) — voir JwtAuthGuard (global, src/app.module.ts).
  @Get('me')
  async findMine(
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<UserResponseDto> {
    const entity = await this.usersService.findByIdOrFail(user.userId);
    return UserResponseDto.fromEntity(entity);
  }

  @UseGuards(TenantScopeGuard, RolesGuard)
  @Roles('owner')
  @Get()
  async list(
    @CurrentUser() user: AuthenticatedUser,
    @Query() pagination: PaginationQueryDto,
  ): Promise<PaginatedResult<UserResponseDto>> {
    if (!user.organizationId) {
      throw new Error(
        'TenantScopeGuard aurait dû rejeter cette requête avant le controller',
      );
    }
    const result = await this.usersService.listByOrganization(
      user.organizationId,
      { page: pagination.page, limit: pagination.limit },
    );
    return {
      ...result,
      items: result.items.map((item) => UserResponseDto.fromEntity(item)),
    };
  }
}
