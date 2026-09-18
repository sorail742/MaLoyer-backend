# ADR-0006 — Soft delete sur les entités racines

## Statut

Accepté — implémenté au niveau schéma (`prisma/schema.prisma`) et dans
chaque repository qui lit une entité de catégorie A.

## Contexte

Le cahier des charges exige la traçabilité complète de l'historique de
location et de paiement (§5.2, §5.5, §5.12 "journal d'activité"). Une
suppression physique d'une entité racine (`Lease`, `Tenant`, `Building`)
casserait l'historique qui en dépend directement.

## Décision

Soft delete (`deletedAt: DateTime?`) sur les entités racines de catégorie
A : `Organization`, `Building`, `Unit`, `Tenant`, `Lease`, `User`. Voir
`darmeuble-kit/docs/backend/soft-delete.md` pour le détail complet des
quatre catégories.

Déjà appliqué :

- `PrismaOrganizationsRepository.findById` / `.archive` — filtre
  `deletedAt: null` en lecture, jamais de `delete` physique.
- `PrismaUsersRepository` — mêmes garanties sur `User`.
- `Payment` reste en catégorie D (cycle de vie par statut, jamais
  supprimé) : pas de `deletedAt` sur ce modèle.

## Justification

Fixer la convention **avant** le premier appel de suppression réel — leçon
tirée de `smartsms-backend`, qui a découvert l'incohérence après coup
(deux modèles portaient déjà `deletedAt` mais leur repository appelait
quand même `.delete()`).

## Conséquences

- Chaque contrainte unique d'une entité de catégorie A (`User.email`,
  `Unit`(`buildingId`,`reference`)) devra devenir un index unique partiel
  (`WHERE deleted_at IS NULL`) en SQL brut dans une migration dédiée, dès
  que ces modèles auront une contrainte unique réelle — Prisma ne le
  déclare pas nativement. Non encore fait : le schéma de départ ne porte
  pas encore de `@@unique` sur `User.email` (voir le commentaire dans
  `prisma/schema.prisma`).
- Archiver une `Organization` doit propager explicitement le soft delete à
  ses entités enfant (`Building`, etc.) dans la **même transaction**
  Prisma — pas encore nécessaire (`buildings` n'existe pas), à implémenter
  avec ce module.
- Tout chemin de lecture d'une entité de catégorie A filtre `deletedAt: null`
  au niveau repository, jamais supposé au niveau service.

## Alternatives écartées

**Suppression physique avec table d'archive séparée.** Duplique le schéma
pour un bénéfice équivalent à une colonne `deletedAt` filtrée.
