import { Injectable, Logger } from '@nestjs/common';
import { SmsSender } from './sms-sender.interface';

/**
 * Implémentation de développement — n'envoie jamais réellement de SMS.
 * **Ne jamais déployer en production** : voir SMS_PROVIDER dans
 * .env.example, à remplacer par un vrai fournisseur une fois choisi (voir
 * darmeuble-kit/docs/backend/socle-backend.md §0bis).
 */
@Injectable()
export class ConsoleSmsSender implements SmsSender {
  private readonly logger = new Logger(ConsoleSmsSender.name);

  send(phone: string, message: string): Promise<void> {
    this.logger.warn(
      `[SMS DEV ONLY] destinataire=${phone} — "${message}" — aucun fournisseur SMS réel configuré (voir darmeuble-kit/docs/backend/socle-backend.md §0bis).`,
    );
    return Promise.resolve();
  }
}
