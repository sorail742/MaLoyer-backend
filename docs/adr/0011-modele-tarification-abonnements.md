# ADR-0011 — Modèle de tarification des abonnements SaaS

## Statut

Proposé — bloqué sur un choix produit.

## Contexte

Le cahier des charges (§1.1) formule encore le modèle économique comme
trois options non tranchées : "abonnement... par immeuble, par unité ou par
palier de nombre d'unités gérées — à valider". Le module 11
(§5.11, "Abonnement SaaS & facturation plateforme") en dépend directement.

## Ce qui bloque

`SubscriptionPlan.unitLimit`/`buildingLimit` (`prisma/schema.prisma`) sont
posés comme deux champs nullables indépendants, reflet des trois options
possibles, pas une validation métier — et la logique de blocage à la
limite (§5.11, "suspension automatique ou limitation des fonctionnalités
en cas d'abonnement expiré/impayé") ne peut pas s'écrire sans savoir
laquelle des trois options s'applique.

## Ce qui ne bloque pas

Le schéma `Subscription`/`SubscriptionPlan` (catégorie D, voir ADR-0006 —
cycle de vie par statut) est déjà posé et peut absorber n'importe laquelle
des trois options sans migration structurelle majeure.

## Décision à prendre (par le porteur produit)

Une des trois options (§1.1), ou une combinaison — avec la logique de
calcul de dépassement associée (que se passe-t-il exactement quand une
organisation dépasse sa limite : blocage de création, dégradation en
lecture seule, notification seule).

## Conséquences une fois tranché

Implémenter le module `subscriptions` (Phase 6) avec la règle réelle,
documenter la logique de blocage dans un ADR dédié ou une mise à jour de
celui-ci une fois le champ vraiment utilisé — ne pas deviner de valeur par
défaut (ex. "par immeuble") dans le code en attendant.
