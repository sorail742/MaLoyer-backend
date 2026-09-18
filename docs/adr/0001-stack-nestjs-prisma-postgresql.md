# ADR-0001 — Stack NestJS + Prisma + PostgreSQL

## Statut

Accepté — imposé par le cahier des charges (§6.1), implémenté.

## Contexte

Le cahier des charges MaLoyer/DarMeuble fixe explicitement la stack
backend : NestJS (TypeScript), PostgreSQL, Prisma, sans alternative
laissée ouverte. Cet ADR documente la décision et sa cohérence avec
l'écosystème de l'équipe (`smartsms-backend`, `Oumra-hadj-project`
utilisent déjà cette combinaison).

## Décision

NestJS 12, TypeScript strict, PostgreSQL, Prisma 7. Versions épinglées
sans `^` (voir `package.json`).

## Justification

**Alignement avec l'écosystème existant.** Mêmes conventions de base
(structure de dossiers, migrations Prisma, tests Jest) qu'un développeur
qui passe de `smartsms-backend`/`Oumra-hadj-project` à ce dépôt.

**API REST plutôt que GraphQL.** Le cahier des charges laisse la porte
ouverte ("évolutif vers GraphQL si besoin", §6.1) mais ne le demande pas —
reconsidérer seulement si un besoin réel de requêtes composites apparaît
côté frontend.

## Conséquences

- Le pattern d'accès aux données (ADR-0003) et l'isolation multi-tenant
  (ADR-0002) sont des décisions **distinctes** de celui-ci.
- **Écart vérifié à l'implémentation, pas supposé** : Prisma ORM 7 exige un
  générateur `prisma-client` (pas `prisma-client-js`) avec un `output`
  explicite, et TypeScript est épinglé en `6.0.3` plutôt que la dernière
  version publiée — voir ADR-0007 pour le détail et la justification de ces
  écarts, vérifiés contre la documentation réelle des outils au moment de
  créer ce dépôt (2026-09-18), pas contre les gabarits du kit de démarrage
  qui supposaient une version antérieure.

## Alternatives écartées

Aucune — la stack est imposée par le cahier des charges, pas choisie par
cet ADR.
