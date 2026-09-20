import { Module } from '@nestjs/common';
import { BuildingsController } from './buildings.controller';
import { BuildingsService } from './buildings.service';
import { BUILDINGS_REPOSITORY } from './repositories/buildings-repository.interface';
import { PrismaBuildingsRepository } from './repositories/prisma-buildings.repository';

@Module({
  controllers: [BuildingsController],
  providers: [
    BuildingsService,
    { provide: BUILDINGS_REPOSITORY, useClass: PrismaBuildingsRepository },
  ],
  exports: [BuildingsService],
})
export class BuildingsModule {}
