/**
 * Réexport unique du client Prisma généré. Prisma ORM 7 exige un `output`
 * explicite pour le générateur `prisma-client` et n'expose plus
 * `PrismaClient` ni les types de modèle depuis le paquet `@prisma/client`
 * (voir prisma/schema.prisma et
 * https://www.prisma.io/docs/orm/v7/prisma-client/setup-and-configuration/generating-prisma-client).
 *
 * Tout le code applicatif importe le client et les types de modèle depuis
 * ce fichier, jamais directement depuis `src/generated/prisma/` — ce
 * dossier est intégralement régénéré par `prisma generate` (donc jamais
 * commité, voir .gitignore) et un import direct multiplierait les chemins
 * relatifs à mettre à jour si `output` change un jour.
 */
export * from '../generated/prisma/client';
