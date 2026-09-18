# ADR-0012 — Modèles de contrat de location (PDF)

## Statut

Proposé — bloqué sur un livrable métier, pas une décision technique.

## Contexte

Le cahier des charges (§5.3) exige la "génération automatique d'un contrat
de location au format PDF à partir d'un modèle personnalisable", et §12.3
formule comme hypothèse que "les modèles de contrat de location seront
fournis ou validés par l'équipe métier avant la Phase 2". Aucun modèle
n'a été fourni à ce jour.

## Ce qui bloque

Le module `leases` (Phase 2) ne peut pas générer de bail PDF réel sans
modèle validé — de même pour les quittances (§5.5, module `invoices`,
Phase 3), qui suivent le même besoin de mise en forme.

## Décision à prendre (par l'équipe métier, pas par un agent)

Contenu et mise en page exacts du modèle de contrat — clauses
obligatoires, mentions légales locales, langue (français exclusivement,
cahier des charges §8).

## Décision technique dépendante (à trancher une fois le modèle connu)

Bibliothèque de génération PDF : `pdf-lib` (génération programmatique,
adaptée à un modèle simple/structuré) ou `puppeteer`/`playwright` (rendu
HTML→PDF, plus lourd mais plus proche d'un gabarit visuel riche) — le choix
dépend de la complexité réelle du modèle fourni, pas d'une préférence
technique a priori (voir `darmeuble-kit/docs/backend/socle-backend.md` §2).

## Conséquences une fois tranché

Documenter le choix de bibliothèque dans un ADR dédié au moment
d'implémenter `leases`/`invoices` — cet ADR ne fait que constater le
blocage, pas trancher entre `pdf-lib` et `puppeteer` par avance.
