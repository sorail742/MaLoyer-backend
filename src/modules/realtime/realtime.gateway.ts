import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import {
  ConnectedSocket,
  OnGatewayConnection,
  OnGatewayDisconnect,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { AppConfig } from '../../config/configuration';
import { JwtPayload } from '../auth/strategies/jwt.strategy';
import { organizationRoom } from './realtime.rooms';

/**
 * Passerelle temps réel (ADR-0017). Aucun consommateur métier avant le
 * module notifications (Phase 5, cahier des charges §5.8/§5.9 — canal
 * "in-app") : ce gateway ne porte que la connexion authentifiée et
 * l'isolation par organisation, pas d'événement métier deviné à l'avance
 * (voir AGENTS.md « Choisir quel ticket travailler »).
 *
 * Authentification au handshake (`socket.handshake.auth.token`), jamais
 * après coup : un client qui ne présente pas un access token valide est
 * déconnecté immédiatement, avant d'avoir pu rejoindre une room.
 */
@WebSocketGateway({
  cors: { credentials: true },
  namespace: '/realtime',
})
export class RealtimeGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server!: Server;

  private readonly logger = new Logger(RealtimeGateway.name);

  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService<AppConfig, true>,
  ) {}

  handleConnection(@ConnectedSocket() client: Socket): void {
    const token = this.extractToken(client);
    if (!token) {
      this.logger.warn(
        `Connexion refusée (token absent) — socket ${client.id}`,
      );
      client.disconnect(true);
      return;
    }

    try {
      const payload = this.jwtService.verify<JwtPayload>(token, {
        secret: this.configService.get('jwt', { infer: true }).accessSecret,
      });
      if (!payload.organizationId) {
        // Super admin (organizationId null) : pas de room organisation,
        // pas de diffusion multi-tenant le concernant pour l'instant.
        this.logger.warn(
          `Connexion refusée (pas d'organisation) — socket ${client.id}`,
        );
        client.disconnect(true);
        return;
      }
      void client.join(organizationRoom(payload.organizationId));
    } catch {
      this.logger.warn(
        `Connexion refusée (token invalide) — socket ${client.id}`,
      );
      client.disconnect(true);
    }
  }

  handleDisconnect(@ConnectedSocket() client: Socket): void {
    this.logger.debug(`Déconnexion — socket ${client.id}`);
  }

  private extractToken(client: Socket): string | undefined {
    const fromAuth = client.handshake.auth['token'] as unknown;
    if (typeof fromAuth === 'string' && fromAuth.length > 0) return fromAuth;

    const header = client.handshake.headers.authorization;
    if (typeof header === 'string' && header.startsWith('Bearer ')) {
      return header.slice('Bearer '.length);
    }
    return undefined;
  }
}
