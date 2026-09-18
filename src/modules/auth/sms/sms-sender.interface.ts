/**
 * Fournisseur SMS non choisi (voir
 * darmeuble-kit/docs/backend/socle-backend.md §0bis) — développer contre
 * une interface abstraite en attendant, même principe que `PaymentProvider`
 * (darmeuble-kit/docs/backend/paiements-djomy.md). `ConsoleSmsSender`
 * (DEV ONLY) journalise le message au lieu de l'envoyer réellement.
 */
export const SMS_SENDER = 'SMS_SENDER';

export interface SmsSender {
  send(phone: string, message: string): Promise<void>;
}
