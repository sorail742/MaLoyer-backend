# MaLoyer — backend (AGENTS.md)

Règles pour tout agent IA (Antigravity, Cursor, Claude Code, ou autre)
travaillant sur ce dépôt. **MaLoyer** est le nom produit/GitHub de ce
projet — le code, les dossiers et la documentation technique gardent leur
nom de code interne « DarMeuble » (ne pas renommer les identifiants
existants sans demande explicite). Dépôt : `git@github.com:sorail742/MaLoyer-backend.git`.

Plateforme SaaS multi-tenant de gestion locative d'immeubles. NestJS 12 +
Prisma 7 + PostgreSQL, TypeScript strict. Documentation de référence
complète dans le dépôt séparé `darmeuble-kit` (cahier des charges, socle,
ADR sources) — ce fichier résume ce qu'un agent doit savoir *avant
d'écrire une ligne*, pas une redite intégrale.

## Commandes

```bash
npm install          # postinstall: prisma generate
npm run start:dev     # port 3000, préfixe /api
npm run lint           # ESLint (règles darmeuble/* incluses)
npm run typecheck      # tsc --noEmit
npm test                # Jest unitaire
npm run test:e2e         # Jest e2e (test/)
npm run build             # nest build
npm run prisma:migrate    # migration locale (nécessite PostgreSQL)
npm run prisma:seed        # crée le premier compte super_admin

docker compose up -d postgres minio   # infra locale (ADR-0015/0016), backend sur l'hôte
docker compose up --build             # backend aussi en conteneur
```

Node exact requis : voir `.nvmrc`. Un seul gestionnaire de paquets (`npm`)
— jamais de `yarn.lock`/`pnpm-lock.yaml` en parallèle. (`darmeuble-frontend`
utilise `pnpm` — décision propre à ce dépôt, voir son `docs/adr/0003-*.md`,
ne pas aligner les deux sans demande explicite.)

## Ce qui ne se discute pas

- **`any` interdit sous toute forme** (`as any`, `@ts-ignore` sans
  justification écrite validée en revue, paramètre implicite). Non-null
  assertion (`foo!.bar`) interdite — exprimer la non-nullité par le
  typage, pas par une assertion. `strictNullChecks` et
  `noUncheckedIndexedAccess` actifs : vérifié par `tsc --noEmit` + ESLint
  dans le hook `pre-commit`, un commit qui viole ces règles se corrige, ne
  se contourne pas.
- **Isolation multi-tenant** — toute requête Prisma sur une table métier
  filtre par `organizationId` (ou la relation parente équivalente). Règle
  ESLint `darmeuble/require-organization-id-filter` sur `**/*.repository.ts`
  (voir `eslint.config.mjs`, liste `TENANT_SCOPED_MODELS` à tenir à jour à
  chaque nouveau modèle). `AuthenticatedUser` (voir
  `src/common/authenticated-user.interface.ts`) est résolu une seule fois
  par requête dans `JwtStrategy` — un service ne recharge **jamais**
  l'utilisateur courant depuis la base.
- **Pattern repository (port/adapter)** — un service métier injecte
  `@Inject(<DOMAINE>_REPOSITORY) private readonly repo: I<Domaine>Repository`,
  jamais `PrismaService` directement. Seule la classe
  `Prisma<Domaine>Repository` du module importe `PrismaService`
  (`src/prisma/prisma.service.ts`). `organizations` sert de module de
  référence (`src/modules/organizations/`).
- **Écriture financière jamais un `update` nu** — toute confirmation de
  paiement ou d'abonnement passe par `updateMany` gardé par une condition
  de statut (motif finalizeTransaction, voir
  `src/modules/auth/repositories/prisma-auth.repository.ts::claimRefreshToken`
  comme exemple déjà appliqué à la rotation de jeton). Règle ESLint
  `darmeuble/require-status-condition-on-write`. Ne jamais confirmer un
  paiement Djomy sur la seule foi d'un webhook — toujours une vérification
  active en complément (réconciliation périodique).
- **Soft delete sur les entités racines** (`Organization`, `Building`,
  `Unit`, `Tenant`, `Lease`, `User`) — jamais de `delete` physique,
  `deletedAt: DateTime?` filtré à la lecture dans le repository. `Payment`
  et `SubscriptionPlan` ne sont jamais supprimés, leur cycle de vie est par
  statut.
- **Contrat de réponse HTTP unique** — succès via `ResponseInterceptor`
  (`{success,data,meta}`), erreur via `AllExceptionsFilter`
  (`{success:false,error}`). Ne jamais inventer un autre format dans un
  controller. Toute liste utilise `PaginationQueryDto`
  (`src/common/dto/pagination-query.dto.ts`).
- **Secrets** — jamais de valeur en dur (clé Djomy, mot de passe, token),
  jamais de contenu de `.env` lu ou loggé. `.env.example` liste les noms de
  variables attendues, jamais de valeur réelle.
- **Taille de fichier** — seuil de conception 400 lignes (`warn`),
  `max-lines-per-function` 80, `max-depth` 4, `complexity` 15. Un fichier
  qui dépasse se découpe, on ne relève jamais le seuil pour faire taire
  l'avertissement.
- **Swagger** — tout nouveau DTO naît avec ses décorateurs
  (`@ApiProperty`/`@ApiPropertyOptional`), route protégée avec
  `@ApiBearerAuth()`.
- **Contexte Guinée/Afrique (ADR-0014)** — devise `GNF` exclusivement,
  téléphone validé `@IsPhoneNumber('GN')` (jamais sans région), constantes
  dans `src/common/constants/locale.ts`. Adresse en texte libre, jamais de
  validation de code postal.
- **Fichiers → `STORAGE_PROVIDER` (ADR-0016)**, jamais le SDK `minio`
  directement dans un module métier. URL signée à durée limitée, jamais un
  objet public.
- **Événement temps réel → `RealtimeService.emitToOrganization(...)`
  (ADR-0017)**, jamais `RealtimeGateway`/`@WebSocketServer()` injecté
  ailleurs.

## Tests

Tout changement de logique métier est accompagné de tests, y compris en
phase bootstrap. Avant de considérer un test terminé, casser volontairement
le code qu'il couvre et vérifier qu'il échoue. Priorités (voir les specs
existantes comme gabarit) :

- Isolation multi-tenant sur chaque table tenant-scopée, dès son premier
  module.
- Rotation/réutilisation de refresh token (`auth.service.spec.ts` en
  gabarit direct — un token déjà utilisé révoque la session entière).
- Portée du `manager` (immeubles assignés) dès que le module `buildings`
  existera.
- Confirmation de paiement concurrente dès le module `payments`.

## Choisir quel ticket travailler (priorité)

Avant de commencer, vérifier sur GitHub Issues — jamais deviner depuis le
nom du module (un agent qui code un module non prioritaire pendant qu'un
autre, plus prioritaire, reste ouvert produit du travail à refaire) :

1. **Respecter « Bloqué par #N »** dans le corps du ticket — ne jamais
   démarrer un ticket dont un bloqueur listé est encore ouvert
   (`gh issue view <N> --json state,closed`).
2. **Parmi les tickets non bloqués, `prio::high` avant `medium` avant
   `low`**, à égalité respecter l'ordre des phases (`phase-0-cadrage` → … →
   `phase-7-tests-lancement`). Ne pas sauter à une phase ultérieure pendant
   qu'un ticket `prio::high` d'une phase antérieure est encore ouvert, sauf
   demande explicite de l'utilisateur.
3. **Un ticket qui référence un ADR « Proposé »** (`docs/adr/README.md`) ne
   se code pas en devinant la réponse — soit c'est le ticket de décision
   lui-même (label `decision-produit`), soit l'implémentation reste
   derrière l'abstraction déjà posée (`PaymentProvider`, `SmsSender`)
   jusqu'à ce que l'ADR passe à « Accepté ».
4. Un ticket `epic` (label `epic`) ne se ferme jamais directement — le
   travail se fait sur ses sous-issues, listées par sa barre de progression
   GitHub.

Discipline `prio::`/`effort::` inspirée de `smartsms-backend`
(`docs/pilotage-equipe.md` : « un ticket entre étiqueté, ou n'entre pas »).

## Git / GitHub

- Branche `feature/<issue>-<slug>` depuis `develop`, jamais depuis `main`.
- **Jamais de push ni de merge direct sur `develop`/`main`**, jamais
  d'approbation ou de merge de Pull Request à la place d'un humain, jamais
  `--no-verify` sans accord explicite.
- Ouvrir une Pull Request (pas « Merge Request », GitHub — voir
  `docs/adr/0007-*.md`) uniquement si demandé explicitement pour cette PR
  précise.
- Aucun secret commité. Vérifier `git status` avant tout `git add -A`.

## Où trouver le reste

- `docs/adr/README.md` — décisions d'architecture de ce dépôt (statut
  accepté = déjà implémenté et vérifié ; proposé = décision produit encore
  ouverte, ne pas deviner la réponse).
- `README.md` — état d'avancement réel (quels modules existent).
- Dépôt `darmeuble-kit` (séparé, en lecture) — cahier des charges complet,
  documents de socle détaillés (`docs/backend/*`), gabarits de code source.
