# ADR 0018 : Relâchement de la limite de lignes par fonction pour les tests

**Statut :** Accepté
**Date :** 2026-09-20

## Contexte
L'analyse de code (via SonarQube Cloud et ESLint) a remonté plusieurs avertissements `max-lines-per-function` sur nos fichiers de tests (`*.spec.ts`, `*.e2e-spec.ts`). Par exemple, les fonctions fléchées encapsulant les blocs `describe()` dans `tenants.service.spec.ts` et `buildings.service.spec.ts` dépassaient facilement la limite stricte de 80 lignes que nous nous sommes fixée pour le code source classique (cahier des charges, seuil de conception).

La structure de Jest fait qu'un bloc `describe` contient généralement la totalité des contextes (`it`) d'une suite de tests, ce qui rend la limite de 80 lignes extrêmement bloquante et non pertinente pour la lisibilité d'un fichier de test (où la verbosité est attendue pour simuler les différents cas).

## Décision
- Nous conservons la règle stricte `max-lines-per-function` (80 lignes, niveau `warn`) pour le code de production (services, controllers, etc.) afin de forcer le découpage modulaire du code métier.
- Nous désactivons (`off`) spécifiquement la règle `max-lines-per-function` pour les fichiers de tests (`**/*.spec.ts`, `test/**/*.ts`) dans le fichier de configuration `eslint.config.mjs`.

## Conséquences
- Plus d'avertissements de ligne dans les CI/CD pour l'écriture des tests.
- Les blocs `describe` peuvent désormais croître pour englober logiquement l'ensemble d'une suite (ex. un service complet).
- Les développeurs gardent le bon sens de séparer leurs tests en plusieurs fichiers s'ils estiment qu'une suite devient difficile à naviguer, ou d'extraire de la logique complexe dans des fonctions utilitaires au sein des tests.
