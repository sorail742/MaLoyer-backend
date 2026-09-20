# MaLoyer — Backend

API backend NestJS de **MaLoyer** (nom de code interne : DarMeuble),
plateforme SaaS multi-tenant de gestion locative d'immeubles (immeubles,
baux, paiements Djomy). Dépôt GitHub :
`git@github.com:sorail742/MaLoyer-backend.git`.

**`AGENTS.md`** — règles condensées pour tout agent IA (Antigravity,
Cursor, Claude Code) travaillant sur ce dépôt ; à lire en premier.
**`docs/adr/`** — décisions d'architecture de ce dépôt (accepté = déjà
implémenté et vérifié, proposé = décision produit encore ouverte).

Voir aussi le dépôt `darmeuble-kit` (kit de démarrage, dépôt séparé) pour
l'intégralité de la documentation de référence :

- `darmeuble-kit/docs/cahier-des-charges.md` — source de vérité fonctionnelle.
- `darmeuble-kit/docs/backend/socle-backend.md` — décisions de socle
  (stack, arborescence, multi-tenant, auth, conventions).
- `darmeuble-kit/docs/backend/architecture.md`,
  `multi-tenant.md`, `paiements-djomy.md`, `soft-delete.md`,
  `coding-rules-backend.md`, `testing.md`, `workflow.md`.
- `darmeuble-kit/docs/backend/adr/` — ADR sources (avant formalisation
  dans `docs/adr/` de ce dépôt).

## État actuel — Phase 1 (Socle)

Implémenté, conformément à l'ordre de construction de
`socle-backend.md` §9 :

- **`organizations`** — module de référence pour le pattern repository
  (port/adapter, ADR-0003). `GET /api/organizations/me`.
- **`users`** — CRUD minimal (profil courant, liste paginée par
  organisation). `GET /api/users/me`, `GET /api/users`.
- **`auth`** — access token JWT (15 min) + refresh token opaque haché
  rotatif (7 jours, cookie `httpOnly`), détection de réutilisation
  (ADR-0004) ; connexion email/mot de passe (propriétaire, gestionnaire,
  comptable, super admin) et OTP SMS (locataire, code envoyé via
  `ConsoleSmsSender` DEV ONLY tant qu'aucun fournisseur SMS réel n'est
  choisi — voir `socle-backend.md` §0bis).
- **Infrastructure transversale** — préfixe `/api`, `ValidationPipe`
  strict, `helmet`, CORS restreint au frontend, `ThrottlerGuard` global,
  `JwtAuthGuard` global (`@Public()` comme échappatoire explicite),
  `TenantScopeGuard` + `RolesGuard` sur les routes tenant-scopées,
  enveloppe de réponse unifiée (`ResponseInterceptor` /
  `AllExceptionsFilter`), logger structuré Pino, Swagger sur
  `GET /api/docs`.
- **Règles ESLint personnalisées** —
  `darmeuble/require-organization-id-filter` et
  `darmeuble/require-status-condition-on-write`, répliquées du kit de
  démarrage (`tools/eslint-rules/`), câblées sur `**/*.repository.ts`.
- **`payments/providers`** — `PaymentProvider` (interface) et
  `MockPaymentProvider`, prêts pour la Phase 3 mais **non encore câblés**
  dans `AppModule` (pas de `PaymentsModule` avant que `leases`/`payments`
  existent — voir ADR-0003 : pas de généralisation avant un appelant réel).
- **`storage`** — `StorageProvider` (interface) et `MinioStorageProvider`
  (ADR-0016), câblés dans `AppModule` (contrairement à `payments`, ce n'est
  pas une décision en attente). Aucun module métier ne l'utilise encore.
- **`realtime`** — `RealtimeGateway`/`RealtimeService` (Socket.IO,
  ADR-0017), connexion authentifiée + isolation par room organisation,
  câblés dans `AppModule`. Aucun événement métier défini avant le module
  `notifications` (Phase 5).
- **Docker** (ADR-0015) — `Dockerfile` (image de production) et
  `docker-compose.yml` (Postgres + MinIO + backend, développement local).

**Non implémenté** (phases suivantes du cahier des charges §10) :
`buildings`, `units`, `tenants` (fiches locataires), `leases`, `payments`
(échéancier + Djomy réel), `invoices`, `expenses`, `maintenance`,
`notifications`, `documents`, `subscriptions`, volet Super Admin
transverse.

## Décisions prises en construisant ce socle (au-delà des templates du kit)

Le kit de démarrage fournit des gabarits de départ, explicitement à
vérifier contre la documentation réelle des outils au moment de
l'installation (voir `socle-backend.md` et les commentaires des templates
eux-mêmes). Écarts constatés et corrigés :

- **Prisma ORM 7** exige un générateur `prisma-client` (pas
  `prisma-client-js`) avec un `output` explicite — le client généré n'est
  plus importable depuis `@prisma/client`. Voir `prisma/schema.prisma`
  (`generator client`) et `src/prisma/prisma-client.ts` (réexport
  unique, seul point d'import du client dans tout le code applicatif).
- **TypeScript** épinglé en `6.0.3`, pas la dernière version publiée
  (`7.x`, compilateur natif Go) : `@nestjs/schematics@12` exige
  `typescript >=6.0.0`, `typescript-eslint@8.70` exige
  `typescript <6.1.0` — `6.0.3` est la seule version stable qui satisfait
  les deux à la fois.
- `PrismaService` déplacé sous `src/prisma/` (conforme à l'arborescence
  documentée dans `socle-backend.md` §3) — les chemins relatifs des
  templates du kit supposaient un fichier à la racine de `src/`.

## Démarrage local

```bash
nvm use            # voir .nvmrc
cp .env.example .env
# remplir DATABASE_URL, JWT_ACCESS_SECRET, MINIO_ACCESS_KEY/MINIO_SECRET_KEY
# (valeurs aléatoires longues) au minimum
docker compose up -d postgres minio   # infra locale (ADR-0015/0016)
npm install         # postinstall: prisma generate
npm run prisma:migrate
npm run start:dev
```

`docker compose up --build` fait aussi tourner le backend en conteneur
(sans `npm install`/`start:dev` sur l'hôte).

`npm run prisma:seed` crée le premier compte `super_admin`
(`SEED_SUPER_ADMIN_EMAIL` / `SEED_SUPER_ADMIN_PASSWORD` dans `.env`) — à
exécuter une seule fois par environnement, jamais via un endpoint HTTP
public.

## Scripts

Voir `package.json`. `lint`, `typecheck`, `test`, `test:e2e`, `build`
sont les portes de qualité — voir `darmeuble-kit/docs/backend/testing.md`
et `coding-rules-backend.md` pour ce qu'elles vérifient et pourquoi.
