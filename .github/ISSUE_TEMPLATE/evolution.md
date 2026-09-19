---
name: Évolution
about: Nouvelle fonctionnalité ou changement de comportement attendu
title: ""
labels: ""
---

<!--
Un ticket qui ne remplit pas ces sections n'est pas recevable — voir
AGENTS.md et darmeuble-kit/docs/backend/coding-rules-backend.md. Il se
complète ou se ferme, il n'entre pas dans une phase tel quel.
-->

## Contexte

<!-- Pourquoi ce ticket existe. Renvoyer au cahier des charges (§ du
darmeuble-kit) ou à l'ADR concernée si applicable. Pas d'interprétation ni
de solution ici. -->

## Comportement attendu

<!-- Ce qui doit exister ou se passer après livraison. Observable, pas une
description d'implémentation. -->

## Bloqué par / dépend de

<!-- Issues ou ADR dont ce ticket dépend (`#123`, `owner/repo#123`,
`docs/adr/000X-*.md`). "Aucun" si indépendant. -->

## Critères d'acceptation

<!-- Checklist actionnable, vérifiable avant fermeture. -->

- [ ]
- [ ]

## Définition de terminé

- [ ] Code fusionné dans `develop`.
- [ ] Tests ajoutés/mis à jour pour tout changement de logique métier, y compris en phase bootstrap.
- [ ] `npm run lint` et `npm run typecheck` propres — zéro nouvelle erreur.
- [ ] Règles du socle respectées (`AGENTS.md`, `.agents/rules/backend.md`) — multi-tenant, pattern repository, écriture financière gardée par condition de statut si applicable.
- [ ] Documentation mise à jour si le changement l'impose (ADR, README).
- [ ] Ce qui reste à faire a son propre ticket, pas un commentaire dans le code.
