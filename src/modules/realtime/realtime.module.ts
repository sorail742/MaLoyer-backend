import { Global, Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { RealtimeGateway } from './realtime.gateway';
import { RealtimeService } from './realtime.service';

/**
 * `@Global()` + `JwtModule.register({})` sans secret par défaut, même
 * raisonnement que `AuthModule` (`RealtimeGateway` passe `secret`
 * explicitement à `verify()`).
 */
@Global()
@Module({
  imports: [JwtModule.register({})],
  providers: [RealtimeGateway, RealtimeService],
  exports: [RealtimeService],
})
export class RealtimeModule {}
