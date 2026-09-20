import { Injectable } from '@nestjs/common';
import { RealtimeGateway } from './realtime.gateway';
import { organizationRoom } from './realtime.rooms';

/**
 * Point d'entrée pour tout module métier qui a besoin de pousser un
 * événement temps réel — évite d'injecter `RealtimeGateway`
 * (`@WebSocketServer`) directement partout. Aucun événement nommé n'est
 * défini ici : chaque module consommateur (notifications en premier)
 * définit ses propres noms d'événement et formes de payload.
 */
@Injectable()
export class RealtimeService {
  constructor(private readonly gateway: RealtimeGateway) {}

  emitToOrganization(
    organizationId: string,
    event: string,
    payload: unknown,
  ): void {
    this.gateway.server
      .to(organizationRoom(organizationId))
      .emit(event, payload);
  }
}
