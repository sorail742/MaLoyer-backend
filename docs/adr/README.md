# Architecture Decision Records — MaLoyer backend (darmeuble-backend)

Un fichier par décision, `NNNN-titre-court.md`, numérotation séquentielle.
Statuts : `proposé`, `accepté`, `déprécié`, `remplacé par ADR-xxxx` —
jamais réécrit une fois accepté (ajouter une section datée plutôt que
modifier le texte existant).

Ces ADR formalisent, contre le code réel de ce dépôt, les décisions déjà
motivées dans le kit de démarrage `darmeuble-kit`
(`docs/backend/adr/`) au moment de la conception, puis vérifiées en
construisant le socle (Phase 0/1, voir `README.md`).

## Index

| ADR | Titre | Statut |
| --- | --- | --- |
| [0001](0001-stack-nestjs-prisma-postgresql.md) | Stack NestJS + Prisma + PostgreSQL | Accepté |
| [0002](0002-multi-tenant-isolation-organization-id.md) | Isolation multi-tenant par `organizationId` | Accepté |
| [0003](0003-pattern-repository-port-adapter.md) | Pattern repository (port/adapter) | Accepté |
| [0004](0004-authentification-access-refresh-rotation.md) | Authentification : access/refresh avec rotation | Accepté |
| [0005](0005-integration-paiement-djomy.md) | Provider de paiement abstrait pour Djomy | Accepté (abstraction) |
| [0006](0006-soft-delete-entites-racines.md) | Soft delete sur les entités racines | Accepté |
| [0007](0007-versions-outillage-verifiees.md) | Versions d'outillage vérifiées à l'implémentation | Accepté |
| [0008](0008-hebergement-github.md) | Hébergement du code source sur GitHub (pas GitLab) | Accepté |
| [0009](0009-contrat-technique-djomy.md) | Contrat technique réel Djomy | Proposé — bloqué sur un tiers externe |
| [0010](0010-fournisseur-sms.md) | Fournisseur SMS | Proposé — bloqué sur un choix produit |
| [0011](0011-modele-tarification-abonnements.md) | Modèle de tarification des abonnements SaaS | Proposé — bloqué sur un choix produit |
| [0012](0012-modeles-contrat-location-pdf.md) | Modèles de contrat de location (PDF) | Proposé — bloqué sur un livrable métier |
| [0013](0013-permissions-fines-gestionnaire-delegue.md) | Permissions fines du gestionnaire délégué par immeuble | Proposé — bloqué sur un choix produit |
| [0014](0014-localisation-guinee-afrique.md) | Conventions de localisation Guinée/Afrique | Accepté |
| [0015](0015-conteneurisation-docker.md) | Conteneurisation Docker | Accepté |
| [0016](0016-stockage-objet-minio.md) | Stockage objet : MinIO auto-hébergé | Accepté |
| [0017](0017-temps-reel-websocket.md) | Temps réel : WebSocket (Socket.IO) | Accepté (infrastructure) |

## Quand créer un nouvel ADR

Pour toute décision qui engage l'architecture au-delà d'un composant
isolé : choix de librairie structurante, changement de stack, nouveau
service externe (fournisseur SMS, stockage objet, PDF), changement
d'hébergement du code. Proposer l'ADR **avant** d'implémenter, jamais
décider silencieusement dans le code.

## Ce que « proposé » signifie ici

Les ADR 0009 à 0013 documentent des décisions que ni cette équipe ni un
agent IA ne doit deviner pour avancer plus vite — elles engagent un choix
produit ou dépendent d'un tiers externe. Chacune fixe l'interface/le
pattern à respecter en attendant (déjà codé contre une abstraction :
`PaymentProvider`, `SmsSender`), pas la réponse finale.
