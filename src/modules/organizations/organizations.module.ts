import { Module } from '@nestjs/common';
import { OrganizationsController } from './organizations.controller';
import { OrganizationsService } from './organizations.service';
import { ORGANIZATIONS_REPOSITORY } from './repositories/organizations-repository.interface';
import { PrismaOrganizationsRepository } from './repositories/prisma-organizations.repository';

/**
 * Module de référence pour le pattern repository — voir
 * darmeuble-kit/docs/backend/adr/0003-pattern-repository-port-adapter.md.
 * `ORGANIZATIONS_REPOSITORY` est exporté pour que d'autres modules
 * (`auth`, plus tard `buildings`...) puissent injecter le repository sans
 * connaître Prisma.
 */
@Module({
  controllers: [OrganizationsController],
  providers: [
    OrganizationsService,
    {
      provide: ORGANIZATIONS_REPOSITORY,
      useClass: PrismaOrganizationsRepository,
    },
  ],
  exports: [OrganizationsService, ORGANIZATIONS_REPOSITORY],
})
export class OrganizationsModule {}
