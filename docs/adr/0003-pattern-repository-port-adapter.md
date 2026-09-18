# ADR-0003 — Pattern repository (port/adapter) pour l'accès aux données

## Statut

Accepté — implémenté dès la Phase 1, trois modules (`organizations`,
`users`, `auth`).

## Contexte

Si chaque service métier NestJS injecte directement `PrismaService`, la
logique métier devient couplée à Prisma : impossible de tester un service
sans base de données réelle. `MaLoyer` vise plusieurs contributeurs sur un
système multi-tenant qui manipule des paiements — le profil exact où
`smartsms-backend` a fait cet arbitrage (contrairement à
`Oumra-hadj-project`, plus petit, à un contributeur principal).

## Décision

Chaque module métier qui accède aux données suit un pattern port/adapter :

```
src/modules/<domaine>/
  <domaine>.module.ts
  repositories/
    <domaine>-repository.interface.ts   # le port : I<Domaine>Repository + jeton Symbol
    prisma-<domaine>.repository.ts      # l'adapter : seule classe du module qui importe PrismaService
```

- Le service métier injecte `@Inject(<DOMAINE>_REPOSITORY) private readonly repo: I<Domaine>Repository` —
  jamais `PrismaService` directement.
- Le module déclare `{ provide: <DOMAINE>_REPOSITORY, useClass: Prisma<Domaine>Repository }`.
- Un jeton `Symbol` est nécessaire car NestJS ne peut pas résoudre une
  interface TypeScript à l'exécution.

`src/modules/organizations/` est le module de référence. `src/prisma/prisma.service.ts`
est la **seule** classe du projet qui importe directement le client Prisma
généré (via `src/prisma/prisma-client.ts`, voir ADR-0007).

## Justification

Séparation entre logique métier et persistance, testabilité sans base
réelle (voir `organizations.service.spec.ts`, `users.service.spec.ts`,
`auth.service.spec.ts` — tous mockent l'interface, pas Prisma), point
unique par domaine où le filtre `organizationId` (ADR-0002) est appliqué et
vérifiable.

## Conséquences

- **À répliquer au moment du portage réel de chaque module, pas
  généralisé d'avance** sur des modules encore vides — `payments/providers/`
  existe déjà (interface + `MockPaymentProvider`) mais n'a volontairement
  pas de module NestJS tant que `payments`/`leases` n'existent pas
  (Phase 3).
- Coût : plus de fichiers et d'indirection par module — accepté comme coût
  du découplage.
- Risque de dérive : si un développeur (ou un agent) injecte
  `PrismaService` directement par simplicité, le bénéfice se perd module
  par module — à vérifier systématiquement en revue de code.

## Alternatives écartées

**Injection directe de `PrismaService`, comme Oumra-hadj-project.** Pas
pour un SaaS multi-tenant visé pour plusieurs développeurs dès le départ.
