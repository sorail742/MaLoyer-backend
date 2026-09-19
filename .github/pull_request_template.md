## Quoi et pourquoi

<!-- Le "pourquoi" compte plus que le "quoi" — voir AGENTS.md et
darmeuble-kit/docs/backend/workflow.md. -->

Closes #

## Checklist (auto-évaluation avant de demander une revue)

- [ ] Pipeline CI vert (`lint` → `build` → `test` → `e2e`).
- [ ] Tests ajoutés/mis à jour pour tout changement de logique métier — y compris en phase bootstrap.
- [ ] Isolation multi-tenant respectée sur toute nouvelle requête (`organizationId`, règle ESLint `darmeuble/require-organization-id-filter`).
- [ ] Toute écriture financière gardée par une condition de statut (`darmeuble/require-status-condition-on-write`), jamais un `update` nu.
- [ ] Aucun secret, clé, mot de passe ou token en dur.
- [ ] Documentation mise à jour si le changement l'impose (ADR, README).

## Ce qu'un relecteur vérifie

Avant le fond : le pipeline est vert, les tests couvrent le changement **et échouent si on casse le code qu'ils couvrent**, aucune règle du socle n'est enfreinte, la description dit pourquoi.

Puis le fond : le code fait-il ce qu'il annonce, et le fait-il là où il faut.
