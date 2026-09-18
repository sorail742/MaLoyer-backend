# ADR-0008 — Hébergement du code source sur GitHub (pas GitLab)

## Statut

Accepté.

## Contexte

Le cahier des charges (§6.5, page de garde) impose GitLab comme dépôt de
code. Le 2026-09-18, l'équipe porteuse du projet a signalé un problème
avec GitLab et demandé de basculer l'hébergement vers GitHub "afin d'aller
le plus vite possible" — aucun détail supplémentaire sur la nature du
problème GitLab n'a été fourni.

## Décision

Les deux dépôts sont hébergés sur GitHub, sous le nom **MaLoyer** (nom
produit/GitHub — le nom de code interne "DarMeuble" reste utilisé dans le
code, les dossiers locaux et la documentation technique, voir `AGENTS.md`) :

- Backend : `git@github.com:sorail742/MaLoyer-backend.git`
- Frontend : `git@github.com:sorail742/MaLoyer-frontend.git`

Chaque dépôt garde deux branches longues, `main` et `develop`, poussées dès
la création. Le flux de travail (`darmeuble-kit/docs/backend/workflow.md`)
reste identique dans son principe (branche `feature/*` depuis `develop`,
jamais de push direct sur `develop`/`main`) ; seule la terminologie change
: **Pull Request** au lieu de Merge Request.

## Justification

Décision produit externe à ce dépôt (contrainte GitLab non détaillée par
l'équipe) — cet ADR documente le changement pour qu'un futur lecteur ne
suppose pas silencieusement GitLab en lisant le cahier des charges §6.5,
qui reste sinon en contradiction apparente avec l'état réel du projet.

## Conséquences

- Toute référence à "Merge Request" dans la documentation issue du kit de
  démarrage (`darmeuble-kit/docs/backend/workflow.md`,
  `docs/cahier-des-charges.md` §6.5) doit se lire comme "Pull Request" pour
  ce dépôt.
- Pipeline CI/CD : à recréer en GitHub Actions plutôt qu'en
  `.gitlab-ci.yml` — non encore fait (aucun pipeline CI n'existe à ce jour
  dans ce dépôt).
- Authentification Git : clé SSH existante (`~/.ssh/id_ed25519`,
  initialement configurée pour `gitlab.smartsms.tech`) ajoutée au compte
  GitHub `sorail742` plutôt qu'une clé dédiée générée pour l'occasion.

## Alternatives écartées

**Maintenir GitLab malgré le problème signalé.** Écarté explicitement par
l'équipe porteuse du projet — pas une décision technique de ce dépôt.
