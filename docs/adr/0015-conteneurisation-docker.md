# ADR-0015 — Conteneurisation Docker

## Statut

Accepté.

## Contexte

Le backend doit pouvoir être déployé comme un conteneur unique sur un
hébergement modeste (VPS), cohérent avec le contexte guinéen/africain
(ADR-0014) : peu d'équipe ops dédiée, coûts d'infrastructure à maîtriser,
pas d'orchestrateur type Kubernetes prévu à ce stade. Le développement
local doit aussi pouvoir démarrer sans installer PostgreSQL/MinIO en dur
sur la machine du développeur.

## Décision

1. **`Dockerfile` en deux étapes** (`build` puis `runtime`), pas un
   découpage à grain fin par type de dépendance. La CLI Prisma
   (devDependency) reste volontairement dans l'image finale : l'étape
   `runtime` copie l'intégralité de `node_modules` produite par l'étape
   `build` plutôt que de refaire un `npm ci --omit=dev` séparé — plus
   simple, et nécessaire pour que `prisma migrate deploy`
   (`docker-entrypoint.sh`) fonctionne au démarrage du conteneur, au prix
   de quelques dizaines de Mo superflus. Image de base :
   `node:24.21.0-alpine` (même version que `engines.node`, vérifiée
   disponible sur Docker Hub le 2026-09-19).
2. **Migrations appliquées au démarrage du conteneur**
   (`docker-entrypoint.sh` : `prisma migrate deploy` puis `exec node
   dist/main.js`), pas via un conteneur d'initialisation séparé — plus
   simple à opérer pour un déploiement mono-VPS. `prisma migrate deploy`
   est sûr en exécution concurrente (verrou consultatif interne à Prisma),
   donc pas de risque même si plusieurs instances démarrent en même temps.
3. **`docker-compose.yml`** pour le développement local uniquement (pas un
   manifeste de production) : services `postgres` (16-alpine),
   `minio` (voir ADR-0016) et `backend` (build de l'image locale).
   Identifiants en dur dans ce fichier (`maloyer`/`maloyer_dev_only`) —
   acceptable uniquement parce qu'ils ne sortent jamais de la machine du
   développeur (voir docs/backend/coding-rules-backend.md du kit sur les
   secrets committés : cette règle vise les vrais secrets, pas un mot de
   passe Postgres local sans exposition réseau).
4. **Utilisateur non-root dans l'image** (`maloyer`), pratique standard —
   pas de justification spécifique au contexte, juste pas de raison de
   l'omettre.

## Justification

Une image + un compose file suffisent pour ce stade du projet (Phase 1,
un seul environnement de production prévu). Complexifier maintenant
(orchestrateur, registre d'images géré, pipeline de build multi-arch)
n'a pas de justification tant qu'il n'y a qu'un déploiement cible.

## Conséquences

- CI (`.github/workflows/ci.yml`) ne construit pas encore l'image Docker
  — à ajouter comme job dès qu'un vrai déploiement existe (pas avant, pour
  ne pas maintenir un job qui ne sert personne).
- `docker-compose.yml` n'est pas un manifeste à copier tel quel en
  production : les identifiants doivent être réels secrets injectés
  (variables d'environnement de l'hébergeur), jamais les valeurs
  `_dev_only` de ce fichier.

## Alternatives écartées

**Multi-stage à 4 étapes (deps / build / prod-deps / runtime) avec
`npm ci --omit=dev` séparé.** Écarté : casse `prisma migrate deploy` au
démarrage (CLI absente d'un install `--omit=dev`, `prisma` étant en
devDependency) sans bénéfice net pour la taille d'image à ce stade —
optimisation prématurée pour un seul déploiement cible.
