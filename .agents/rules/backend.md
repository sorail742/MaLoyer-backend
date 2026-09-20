# MaLoyer backend — règles du socle

À appliquer sur tout code de ce dépôt (`darmeuble-backend`, publié sous
`MaLoyer-backend` sur GitHub). NestJS 12, TypeScript strict, Prisma 7 +
PostgreSQL, Jest. SaaS multi-tenant de gestion locative d'immeubles.
Documentation complète : `AGENTS.md`, `docs/adr/README.md`, dépôt séparé
`darmeuble-kit`.

## Typage

- **`any` interdit sous toute forme** — ni `as any`, ni `@ts-ignore` sans
  justification écrite validée en revue, ni paramètre implicitement typé.
- `strictNullChecks` et `noUncheckedIndexedAccess` actifs : vérifier,
  jamais supposer qu'une valeur est présente. Non-null assertion
  (`foo!.bar`) interdite.
- Le hook `pre-commit` (ESLint + `tsc --noEmit`) vérifie ces règles — un
  commit qui les viole se corrige, ne se contourne pas.

## Multi-tenant — la règle qui expose des données si on l'oublie

- **Toute requête sur une table métier filtre par `organizationId`** (ou
  la relation parente équivalente). Une règle ESLint projet
  (`darmeuble/require-organization-id-filter`) le vérifie sur les
  `*.repository.ts` — liste `TENANT_SCOPED_MODELS` dans
  `eslint.config.mjs` à tenir à jour dans la même MR qu'un nouveau modèle.
- **Un service ne recharge jamais l'utilisateur courant depuis la base.**
  `JwtStrategy` le résout une fois par requête et expose
  `AuthenticatedUser` ; un service lit ce que lui passe `@CurrentUser()`.
- Le `manager` (gestionnaire délégué) a une portée **limitée aux
  immeubles qui lui sont assignés**, en plus du filtre `organizationId` —
  deux couches, jamais fusionnées dans une condition ad hoc.

## Accès aux données — jamais `PrismaService` directement

Un service injecte `@Inject(<DOMAINE>_REPOSITORY)` une interface
`I<Domaine>Repository`, jamais `PrismaService`. Seule
`Prisma<Domaine>Repository` importe `PrismaService`. `organizations` est le
module de référence de ce pattern.

## Paiements — jamais un `update` nu

Toute confirmation de paiement ou d'abonnement passe par `updateMany`
gardé par une condition de statut (motif finalizeTransaction) — deux
webhooks concurrents ne doivent jamais créditer deux fois. Règle ESLint
`darmeuble/require-status-condition-on-write`. Un webhook Djomy ne suffit
jamais seul à confirmer un paiement : toujours une vérification active en
complément (réconciliation périodique).

## Suppression — soft delete sur les entités racines

`Organization`, `Building`, `Unit`, `Tenant`, `Lease`, `User` : jamais de
`delete` physique, `deletedAt` filtré à la lecture dans le repository.
`Payment`/`SubscriptionPlan` ne se suppriment jamais, leur cycle de vie est
par statut.

## Taille et complexité

- **400 lignes par fichier** (`max-lines`, hors vides et commentaires),
  `max-lines-per-function` 80, `max-depth` 4, `complexity` 15. Toutes en
  `warn`.
- Un fichier qui franchit le seuil se **découpe**. Ne jamais relever le
  seuil pour faire taire l'avertissement.
- Exempts de `max-lines` : `*.spec.ts`, `test/**/*.ts`, `*.dto.ts`.

## Contrat HTTP

- Réponse succès enveloppée par `ResponseInterceptor` :
  `{ success, data, meta }`. Erreur par `AllExceptionsFilter` :
  `{ success: false, error }`. Ne jamais inventer un format dans un
  controller.
- Toute liste utilise `PaginationQueryDto` (`page`, `limit`, `sortBy`,
  `sortOrder`).
- Tout nouveau DTO naît avec ses décorateurs Swagger
  (`@ApiProperty`/`@ApiPropertyOptional`), route protégée avec
  `@ApiBearerAuth()`.

## Contexte Guinée/Afrique, stockage, temps réel

- **Localisation (ADR-0014)** : devise `GNF` exclusivement, téléphone
  validé `@IsPhoneNumber('GN')` (jamais sans région), constantes dans
  `src/common/constants/locale.ts`. Adresse en texte libre, jamais de
  validation de code postal.
- **Fichiers → `STORAGE_PROVIDER` (ADR-0016, MinIO auto-hébergé)**, jamais
  le SDK `minio` directement dans un module métier. URL signée à durée
  limitée, jamais un objet public.
- **Événement temps réel → `RealtimeService.emitToOrganization(...)`
  (ADR-0017)**, jamais `RealtimeGateway` injecté ailleurs. Aucun événement
  métier n'est défini par l'infrastructure elle-même — chaque module
  consommateur définit les siens.
- **Docker (ADR-0015)** : `docker compose up -d postgres minio` pour
  l'infra locale, `Dockerfile` en deux étapes (`build`/`runtime`),
  migrations appliquées au démarrage du conteneur
  (`docker-entrypoint.sh`), jamais dans l'image elle-même.

## Tests

- Tout changement de logique métier est accompagné de tests, y compris en
  phase bootstrap.
- Vérifier qu'un test échoue quand on casse le code qu'il couvre — un test
  qui passe dans les deux cas ne protège rien.
- Isolation multi-tenant et écriture financière ont un test dédié dès leur
  premier module (voir `auth.service.spec.ts` pour le gabarit de test de
  rotation/réutilisation de refresh token).

## Choisir quel ticket travailler (priorité)

Avant de commencer, vérifier sur GitHub Issues — jamais deviner depuis le
nom du module :

- **Respecter « Bloqué par #N »** — ne jamais démarrer un ticket dont un
  bloqueur listé est encore ouvert.
- **Parmi les tickets non bloqués, `prio::high` avant `medium` avant
  `low`**, à égalité l'ordre des phases (`phase-0-cadrage` → … →
  `phase-7-tests-lancement`). Ne pas sauter à une phase ultérieure pendant
  qu'un ticket `prio::high` d'une phase antérieure est encore ouvert, sauf
  demande explicite de l'utilisateur.
- **Un ticket qui référence un ADR « Proposé »** ne se code pas en devinant
  la réponse — implémentation derrière l'abstraction déjà posée
  (`PaymentProvider`, `SmsSender`) jusqu'à ce que l'ADR passe à « Accepté ».
- Un ticket `epic` ne se ferme jamais directement — le travail se fait sur
  ses sous-issues.

Discipline `prio::`/`effort::` inspirée de `smartsms-backend`
(`docs/pilotage-equipe.md`).

## Git / GitHub

- Branche `feature/*` depuis `develop`. **Jamais de push ni de merge sur
  `develop`/`main`**, jamais d'approbation ou de merge de Pull Request à la
  place d'un humain.
- **Jamais `--no-verify`** sans accord explicite.
- Aucune trace d'outil de génération imposée par défaut dans un message de
  commit — suivre la convention déjà en vigueur sur ce dépôt.
- Jamais de secret en dur, jamais de contenu de `.env` lu ni affiché.
