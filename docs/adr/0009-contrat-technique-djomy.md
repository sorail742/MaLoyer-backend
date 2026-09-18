# ADR-0009 — Contrat technique réel Djomy

## Statut

Proposé — bloqué sur un accès externe, pas une décision technique interne.
Ne pas deviner la réponse pour avancer plus vite.

## Contexte

Le cahier des charges impose Djomy comme moyen de paiement (§6.3) mais
formule lui-même comme hypothèse à confirmer que "Djomy expose une
API/des webhooks exploitables pour l'intégration" (§12.3). Aucune
documentation technique Djomy (endpoints, format de webhook, en-têtes
d'authentification, modes de paiement disponibles — redirection ou
in-app) n'a été vérifiée à ce jour.

## Ce qui bloque

L'implémentation réelle de `DjomyPaymentProvider`
(`src/modules/payments/providers/`, interface déjà posée — voir ADR-0005)
et, en aval, tout le module `payments` (Phase 3) qui en dépend pour le
paiement en ligne du loyer (les paiements manuels espèces/virement restent
disponibles indépendamment, voir `darmeuble-kit/docs/backend/paiements-djomy.md`).

## Ce qui ne bloque pas

`MockPaymentProvider` permet de développer et tester la Phase 3 sans
attendre — générer l'échéancier, l'historique, la relance d'impayés, les
quittances (§5.4, §5.5) ne dépendent pas du contrat Djomy réel, seule
l'étape "payer en ligne" en dépend.

## Décision à prendre (par le porteur produit, pas par un agent)

- Documentation technique Djomy (référentiel API) obtenue, ou accès à un
  compte marchand de test.
- Noms de variables d'environnement réels (`DJOMY_API_KEY`,
  `DJOMY_MERCHANT_ID`, `DJOMY_WEBHOOK_SECRET` dans `.env.example` sont des
  placeholders de départ, pas un contrat vérifié).
- Mode de paiement effectivement proposé par Djomy (redirection vs
  in-app) — détermine si `InitiatedPayment.paymentUrl` est utilisé.

## Conséquences une fois tranché

Remplacer `MockPaymentProvider` par `DjomyPaymentProvider` sans changer
l'interface `PaymentProvider` ni le reste du code qui la consomme
(`payments.service.ts`, `subscriptions.service.ts` à venir). Créer la
tâche planifiée de réconciliation (`checkStatus`) dès ce moment, pas après
— voir ADR-0005 §Conséquences.
