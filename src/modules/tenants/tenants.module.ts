import { Module } from '@nestjs/common';
import { PrismaTenantsRepository } from './repositories/prisma-tenants.repository';
import { TENANTS_REPOSITORY } from './repositories/tenants-repository.interface';
import { TenantsController } from './tenants.controller';
import { TenantsService } from './tenants.service';

@Module({
  controllers: [TenantsController],
  providers: [
    {
      provide: TENANTS_REPOSITORY,
      useClass: PrismaTenantsRepository,
    },
    TenantsService,
  ],
  exports: [TenantsService],
})
export class TenantsModule {}
