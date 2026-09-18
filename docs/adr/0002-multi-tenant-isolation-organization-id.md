# ADR-0002 — Isolation multi-tenant par `organizationId`

## Statut

Accepté — implémenté dès la Phase 1 (module `users`).

## Contexte

Le cahier des charges (§4, §6.2, §6.4) exige une isolation stricte des
données entre organisations (propriétaires/agences) : "chaque organisation
dispose d'un espace cloisonné... invisibles des autres organisations". Il
identifie lui-même ce point comme le risque le plus élevé du projet (§12.2,
"Complexité du multi-tenant sous-estimée → Risque de fuite de données entre
organisations").

`smartsms-backend` a déjà ce même profil (SaaS multi-tenant, `clientId` sur
chaque table métier) et documente une leçon directement transposable :
sans mécanisme de vérification automatique, un oubli de filtre passe la
revue humaine.

## Décision

**Isolation au niveau applicatif, par `organizationId` sur chaque table
métier**, contrôlée par trois mécanismes complémentaires :

1. **`AuthenticatedUser` résolu une fois** par requête HTTP
   (`src/modules/auth/strategies/jwt.strategy.ts`), jamais rechargé depuis
   la base par un service.
2. **Chaque repository filtre explicitement par `organizationId`** sur
   toute requête Prisma touchant une table tenant-scopée (voir
   `src/modules/users/repositories/prisma-users.repository.ts` comme
   premier exemple réel).
3. **Une règle ESLint personnalisée**
   (`darmeuble/require-organization-id-filter`, voir
   `tools/eslint-rules/require-organization-id-filter.js`, câblée dans
   `eslint.config.mjs`) signale toute requête sur une table de la liste
   `TENANT_SCOPED_MODELS` dont le `where` ne contient pas la clef de
   scoping.

Voir `darmeuble-kit/docs/backend/multi-tenant.md` pour le détail complet,
y compris la portée intra-organisation additionnelle du rôle `manager`
(non encore implémentée : dépend du module `buildings`, Phase 2).

## Justification

**Pourquoi une règle ESLint et pas seulement la revue humaine.** Coût
d'écriture de la règle sans commune mesure avec le coût d'une fuite de
données entre deux organisations clientes payantes — leçon directement
tirée de `smartsms-backend` (trois oublis réels avant que la règle
n'existe).

**Pourquoi ne pas utiliser Row-Level Security (RLS) PostgreSQL.**
Envisageable, mais plus complexe à opérer avec Prisma et moins visible en
revue de code qu'un filtre explicite — à reconsidérer si le nombre de
tables tenant-scopées devient difficile à auditer manuellement.

## Conséquences

- Tout nouveau modèle métier ajouté au schéma Prisma doit être ajouté à
  `TENANT_SCOPED_MODELS` (`eslint.config.mjs`) dans la même PR.
- Le `super_admin` (sans `organizationId`) a besoin de requêtes
  transverses légitimes — traitées par l'échappatoire `eslint-disable`
  documentée (voir les lookups par email/téléphone dans
  `prisma-users.repository.ts`, cas "scans techniques (auth)"), jamais par
  une exception silencieuse dans la règle elle-même.
- `TenantScopeGuard` (`src/common/guards/tenant-scope.guard.ts`) est une
  garde de forme au niveau HTTP (vérifie que l'utilisateur porte un
  `organizationId`), pas un filtre de données — le filtre réel reste au
  niveau repository.

## Alternatives écartées

**Une base de données par organisation.** Coût opérationnel disproportionné
à ce stade. **Row-Level Security PostgreSQL.** Voir §Justification.
