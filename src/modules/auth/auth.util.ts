import { createHash } from 'node:crypto';

/**
 * Empreinte SHA-256 hexadécimale — utilisée pour le refresh token opaque
 * (ADR-0004) et pour le code OTP, jamais pour un mot de passe (bcrypt,
 * voir auth.service.ts). Ni l'un ni l'autre n'a besoin d'un coût de calcul
 * élevé côté vérification : un refresh token comme un code OTP sont déjà
 * des secrets à haute entropie ou à durée de vie très courte, contrairement
 * à un mot de passe choisi par un humain.
 */
export function sha256Hex(value: string): string {
  return createHash('sha256').update(value).digest('hex');
}

/**
 * Parseur minimal pour les durées `.env` (`15m`, `7d`, `300s`, `1h`) — pas
 * de dépendance dédiée pour ce seul besoin. Volontairement strict :
 * n'accepte qu'un entier suivi d'une unité `s|m|h|d`, lève une erreur
 * explicite sinon plutôt qu'une valeur par défaut silencieuse sur une
 * config mal formée.
 */
const UNIT_TO_MS: Record<string, number> = {
  s: 1000,
  m: 60 * 1000,
  h: 60 * 60 * 1000,
  d: 24 * 60 * 60 * 1000,
};

export function parseDurationMs(value: string): number {
  const match = /^(\d+)([smhd])$/.exec(value.trim());
  if (!match) {
    throw new Error(
      `Durée invalide "${value}" — format attendu : un entier suivi de s|m|h|d (ex. "15m", "7d")`,
    );
  }
  const [, amount, unit] = match;
  if (!amount || !unit) {
    throw new Error(`Durée invalide "${value}"`);
  }
  const unitMs = UNIT_TO_MS[unit];
  if (unitMs === undefined) {
    throw new Error(`Unité de durée inconnue "${unit}"`);
  }
  return Number(amount) * unitMs;
}
