# ADR-0014 — Conventions de localisation Guinée/Afrique

## Statut

Accepté.

## Contexte

MaLoyer est une plateforme SaaS opérée en Guinée (cahier des charges §1,
§8) — pas un produit générique internationalisé. Plusieurs décisions déjà
prises ailleurs dans ce dépôt reflétaient déjà ce contexte de fait (devise
`GNF` par défaut sur toutes les tables monétaires du schéma Prisma,
`PaymentProvider.currency` typé en littéral `'GNF'`, Djomy comme
intégration de paiement — voir ADR-0005/0009) sans qu'un document ne
formalise la convention pour le reste du code applicatif. Cet ADR comble
ce trou : toute nouvelle fonctionnalité doit refléter ce contexte
explicitement, pas par défaut implicite.

## Décision

1. **Devise : `GNF` exclusivement**, déjà en place (`prisma/schema.prisma`,
   `PaymentProvider`). Nouvelle constante `CURRENCY`
   (`src/common/constants/locale.ts`) pour tout nouveau code qui a besoin
   de la valeur en dehors d'un type littéral déjà existant. Aucune
   conversion de devise, aucun support multi-devise.
2. **Téléphone : validé contre la région Guinée (`GN`)**, pas seulement
   "un numéro international valide quelconque". `IsPhoneNumber()` (sans
   argument, `otp-request.dto.ts`/`otp-verify.dto.ts`) acceptait un numéro
   étranger valide mais hors du marché cible — corrigé en
   `IsPhoneNumber('GN')`. Toute nouvelle DTO avec un champ téléphone
   (fiche locataire, contact d'urgence, etc.) suit la même règle. Constante
   `PHONE_REGION = 'GN'` / `PHONE_CALLING_CODE = '+224'` dans
   `src/common/constants/locale.ts`.
3. **Fuseau horaire : `Africa/Conakry`, UTC+0 sans heure d'été.** Les dates
   restent stockées en UTC (`DateTime` Prisma, comportement par défaut) —
   comme Conakry est déjà à UTC+0 toute l'année, stockage et affichage
   coïncident sans conversion. Documenté (`TIMEZONE` dans
   `src/common/constants/locale.ts`) plutôt que laissé implicite, pour
   qu'une expansion hors Guinée ne suppose pas à tort qu'aucune conversion
   n'est jamais nécessaire.
4. **Adresses : champ texte libre, jamais de validation de code postal.**
   La Guinée n'a pas de système d'adressage postal formel généralisé
   (cahier des charges §5.1, `Building.address`) — un immeuble se
   localise par quartier/repère, pas par CP. Ne jamais ajouter de
   validation de format d'adresse calquée sur un système postal européen.
5. **Connectivité : payloads HTTP sobres, pas d'hypothèse de bande passante
   large.** Conséquence pratique déjà en place (`PaginationQueryDto`
   obligatoire sur toute liste) plutôt qu'une nouvelle règle — rappelée ici
   pour que les futurs modules (photos d'immeuble, documents locataire,
   voir ADR-0016) compressent/dimensionnent les fichiers avant stockage,
   pas seulement au moment de l'affichage frontend.

## Justification

Le cahier des charges (§8, "Interface en français, montants en Franc
Guinéen (GNF), formats de date locaux") fixe déjà cette contrainte —
cet ADR la rend vérifiable dans le code (une seule source de vérité,
`src/common/constants/locale.ts`) plutôt que dispersée en littéraux.

## Conséquences

- Tout nouveau champ téléphone dans une DTO copie
  `@IsPhoneNumber(PHONE_REGION)`, jamais `@IsPhoneNumber()` seul.
- Toute constante liée à la Guinée (devise, indicatif, fuseau) vit dans
  `src/common/constants/locale.ts` — jamais un nouveau littéral dupliqué
  ailleurs.

## Alternatives écartées

**`@IsPhoneNumber()` sans région, avec validation métier a posteriori du
préfixe `+224`.** Rejeté : deux points de vérité pour la même règle,
et un numéro international valide mais non guinéen resterait accepté par
le premier validateur avant d'être rejeté plus loin — la région existe
précisément pour éviter cette double couche.
