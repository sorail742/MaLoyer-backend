import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';

/**
 * `@Global()` : évite de réimporter `PrismaModule` dans chaque module métier
 * — seuls les repositories (`Prisma<Domaine>Repository`) injectent
 * réellement `PrismaService`, voir ADR-0003 du kit de démarrage.
 */
@Global()
@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class PrismaModule {}
