import { Module } from '@nestjs/common';
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { LoggerModule } from 'nestjs-pino';
import { AppConfig, configuration } from './config/configuration';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';
import { ResponseInterceptor } from './common/interceptors/response.interceptor';
import { AuthModule } from './modules/auth/auth.module';
import { BuildingsModule } from './modules/buildings/buildings.module';
import { OrganizationsModule } from './modules/organizations/organizations.module';
import { UsersModule } from './modules/users/users.module';
import { PrismaModule } from './prisma/prisma.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, load: [configuration] }),
    LoggerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService<AppConfig, true>) => {
        const isProduction =
          configService.get('nodeEnv', { infer: true }) === 'production';
        // `transport` n'est construit que hors production : sous
        // `exactOptionalPropertyTypes` (tsconfig.json), une propriété
        // optionnelle omise n'est pas la même chose qu'une propriété posée
        // à `undefined` — on construit donc l'objet conditionnellement
        // plutôt que d'assigner `undefined` explicitement.
        return {
          pinoHttp: {
            level: isProduction ? 'info' : 'debug',
            // Ne jamais logger un secret ou un mot de passe — voir
            // darmeuble-kit/docs/backend/coding-rules-backend.md.
            redact: [
              'req.headers.authorization',
              'req.headers.cookie',
              'res.headers["set-cookie"]',
            ],
            ...(isProduction
              ? {}
              : {
                  transport: {
                    target: 'pino-pretty',
                    options: { singleLine: true },
                  },
                }),
          },
        };
      },
    }),
    ThrottlerModule.forRootAsync({
      imports: [],
      inject: [ConfigService],
      useFactory: (configService: ConfigService<AppConfig, true>) => {
        const throttle = configService.get('throttle', { infer: true });
        return [{ ttl: throttle.ttlMs, limit: throttle.limit }];
      },
    }),
    PrismaModule,
    OrganizationsModule,
    UsersModule,
    AuthModule,
    BuildingsModule,
  ],
  providers: [
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    // Guard global : voir src/common/guards/jwt-auth.guard.ts — toute route
    // est protégée par défaut, `@Public()` est la seule échappatoire.
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_FILTER, useClass: AllExceptionsFilter },
    { provide: APP_INTERCEPTOR, useClass: ResponseInterceptor },
  ],
})
export class AppModule {}
