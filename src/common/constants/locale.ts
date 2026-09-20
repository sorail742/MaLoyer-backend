/**
 * Constantes de localisation — plateforme opérée en Guinée (ADR-0014).
 * Un seul point de vérité : jamais de littéral `'GNF'`/`'+224'`/région
 * téléphone en dur ailleurs dans le code applicatif.
 */

/** Devise unique de la plateforme (cahier des charges §8). */
export const CURRENCY = 'GNF';

/** Indicatif téléphonique. Région ISO 3166-1 alpha-2 pour `IsPhoneNumber`. */
export const PHONE_CALLING_CODE = '+224';
export const PHONE_REGION = 'GN';

/**
 * Africa/Conakry = UTC+0 toute l'année (pas d'heure d'été). Les dates sont
 * stockées en UTC (Prisma `DateTime`, jamais de décalage appliqué en base) ;
 * cette constante documente qu'aucune conversion de fuseau n'est nécessaire
 * entre stockage et affichage — ne pas en déduire qu'un autre fuseau ne se
 * posera jamais (expansion hors Guinée non prévue à ce jour, mais pas
 * interdite par le schéma).
 */
export const TIMEZONE = 'Africa/Conakry';
