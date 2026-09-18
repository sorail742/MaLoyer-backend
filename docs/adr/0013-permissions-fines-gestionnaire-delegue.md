# ADR-0013 — Permissions fines du gestionnaire délégué par immeuble

## Statut

Proposé — bloqué sur un choix produit.

## Contexte

Le cahier des charges (§4) décrit le rôle `manager` (gestionnaire délégué)
comme ayant des "droits limités selon les immeubles ou tâches qui lui sont
assignés", sans détailler la portée exacte : uniquement une liste
d'immeubles visibles en lecture ? Des actions différentes selon
l'immeuble (lecture seule sur certains, gestion complète sur d'autres) ?
Une notion de "tâches" distincte des immeubles, non modélisée à ce jour ?

## Ce qui bloque

Le design précis du filtre de portée intra-organisation du `manager`
au-delà du RBAC à plat déjà implémenté (5 rôles, voir
`src/common/authenticated-user.interface.ts`) — voir
`darmeuble-kit/docs/backend/multi-tenant.md` §"Portée intra-organisation".
Bloque en pratique le module `buildings` (Phase 2), qui doit savoir
comment filtrer une liste d'immeubles pour un `manager`.

## Ce qui ne bloque pas

Le RBAC à plat (5 rôles) est déjà implémenté et suffisant pour distinguer
`owner`/`manager`/`accountant`/`tenant`/`super_admin` sans la portée fine —
`buildings` peut démarrer avec "un `manager` voit tous les immeubles de son
organisation" comme comportement temporaire explicite, à condition de ne
pas le documenter comme définitif.

## Décision à prendre (par le porteur produit)

- Modéliser l'assignation via une table de jonction (`BuildingManager` ou
  équivalent, voir la relation `N—N Buildings` du cahier des charges §7
  pour `User`) — le pattern est déjà pressenti dans
  `darmeuble-kit/docs/backend/multi-tenant.md`, pas encore implémenté (le
  schéma `prisma/schema.prisma` de ce dépôt ne porte pas encore de modèle
  `BuildingManager`).
- Confirmer qu'un `owner`/`accountant` n'a jamais cette restriction (voit
  tous les immeubles de son organisation) — le cahier des charges ne la
  demande que pour `manager`, ne pas généraliser un filtre par immeuble à
  tous les rôles sans validation.

## Conséquences une fois tranché

Ajouter le modèle Prisma de jonction et son filtre au module `buildings`
dès sa création (Phase 2), avec un test dédié ("un `manager` non assigné à
un immeuble ne peut ni le lire ni le modifier, même au sein de sa propre
organisation" — voir `darmeuble-kit/docs/backend/testing.md`), pas ajouté
après coup une fois `buildings` déjà construit sans cette contrainte.
