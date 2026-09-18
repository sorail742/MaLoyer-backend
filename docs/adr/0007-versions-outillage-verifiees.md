# ADR-0007 — Versions d'outillage vérifiées à l'implémentation

## Statut

Accepté.

## Contexte

Le kit de démarrage `darmeuble-kit` fournit des gabarits de code
(`code-templates/backend/`) écrits contre une version antérieure de
l'écosystème NestJS/Prisma/TypeScript, avec un avertissement explicite :
vérifier chaque version réelle au moment de créer le dépôt plutôt que de
supposer que les gabarits restent exacts (`docs/backend/socle-backend.md`
§2, commentaires de `prisma.service.ts`). En créant ce dépôt (2026-09-18),
plusieurs incompatibilités réelles ont été trouvées entre les gabarits et
l'état actuel de l'écosystème.

## Décision

Trois écarts vérifiés contre la documentation et le registre npm réels,
puis actés :

1. **Générateur Prisma 7** — `provider = "prisma-client"` (pas
   `prisma-client-js`) avec un `output` explicite obligatoire
   (`prisma/schema.prisma`). Le client généré n'est plus importable depuis
   `@prisma/client` ; tout le code applicatif importe depuis
   `src/prisma/prisma-client.ts` (réexport unique), jamais directement
   depuis `src/generated/prisma/` (régénéré à chaque `prisma generate`,
   jamais commité).
2. **TypeScript épinglé en `6.0.3`**, pas la dernière version publiée
   (`7.x`, compilateur natif). `@nestjs/schematics@12` exige
   `typescript >=6.0.0` ; `typescript-eslint@8.70` exige
   `typescript <6.1.0` — `6.0.3` est la seule version stable qui satisfait
   les deux à la fois.
3. **`engines.node` exprimé en plage** (`>=24.21.0`), jamais en version
   exacte, malgré la recommandation de `darmeuble-kit/docs/backend/coding-rules-backend.md`
   de fixer une version Node précise dans `.nvmrc`. `.nvmrc` reste exact ;
   `package.json engines.node` doit rester une plage, sous peine de
   bloquer `npm install` pour tout contributeur sur un patch plus récent
   que celui figé — surtout avec `engine-strict=true` (`.npmrc`), qui
   applique cette contrainte aux sous-processus `npm install` lancés par
   des outils tiers (ex. CLI shadcn côté frontend) dans le dépôt.

## Justification

Le kit lui-même instruit de "se référer à la documentation Prisma [ou
TypeScript] en vigueur à ce moment-là plutôt qu'à ce commentaire" — cet ADR
applique cette instruction et documente le résultat pour que la prochaine
personne (ou le prochain agent) n'ait pas à refaire la même vérification.

## Conséquences

- Toute mise à jour future de Prisma ou TypeScript doit revérifier ces
  contraintes avant de faire évoluer les pins, pas les faire glisser
  silencieusement avec `npm update`.
- `npm audit` signale 4 vulnérabilités "high" dans `mysql2`/`deepmerge-ts`,
  dépendances transitives de `prisma@7.10.0` (driver MySQL non utilisé par
  ce projet, PostgreSQL uniquement) — corriger avec `npm audit fix --force`
  forcerait un retour à `prisma@6.x`, ce qui romprait le générateur
  `prisma-client` et `prisma.config.ts` décrits ci-dessus. À surveiller via
  les notes de version Prisma plutôt qu'à corriger par downgrade.

## Alternatives écartées

**Suivre `latest` sur npm sans vérification.** A produit, en pratique lors
de la création de ce dépôt, un conflit de résolution `ERESOLVE` immédiat
(`@nestjs/schematics` vs `typescript-eslint`) — la vérification manuelle
n'est pas une prudence excessive, c'est ce qui a permis de démarrer le
projet du premier coup.
