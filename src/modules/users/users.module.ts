import { Module } from '@nestjs/common';
import { PrismaUsersRepository } from './repositories/prisma-users.repository';
import { USERS_REPOSITORY } from './repositories/users-repository.interface';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';

/**
 * `USERS_REPOSITORY` et `UsersService` sont exportés pour `AuthModule`, qui
 * a besoin de chercher/créer des comptes sans connaître Prisma — voir
 * darmeuble-kit/docs/backend/adr/0003-pattern-repository-port-adapter.md.
 */
@Module({
  controllers: [UsersController],
  providers: [
    UsersService,
    { provide: USERS_REPOSITORY, useClass: PrismaUsersRepository },
  ],
  exports: [UsersService],
})
export class UsersModule {}
