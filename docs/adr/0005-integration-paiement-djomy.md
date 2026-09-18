# ADR-0005 — Provider de paiement abstrait pour Djomy

## Statut

Accepté pour l'abstraction (`PaymentProvider`, `MockPaymentProvider`,
implémentés). L'implémentation réelle Djomy reste bloquée — voir ADR-0009.

## Contexte

Le cahier des charges impose Djomy comme moyen de paiement (§6.3) pour deux
flux distincts : loyer (locataire) et abonnement SaaS (organisation).
Aucun contrat technique Djomy n'a été vérifié (le cahier des charges le
formule lui-même comme hypothèse, §12.3).

## Décision

**Une interface `PaymentProvider`** sans dépendance à Djomy dans le reste
du code — voir `src/modules/payments/providers/payment-provider.interface.ts` :

```ts
export interface PaymentProvider {
  initiate(request: PaymentInitiationRequest): Promise<InitiatedPayment>;
  checkStatus(providerReference: string): Promise<PaymentProviderStatus>;
}
```

`MockPaymentProvider` (`src/modules/payments/providers/mock-payment-provider.service.ts`) :
implémentation de développement, avertissement explicite "DEV ONLY" dans
les logs, ne parle jamais réellement à Djomy. `DjomyPaymentProvider` :
implémentation réelle, à écrire une fois le contrat Djomy vérifié
(ADR-0009) — sans changer l'interface.

**Non encore câblé dans `AppModule`** : ce module n'a pas de consommateur
avant la Phase 3 (`payments`/`leases`) — cohérent avec ADR-0003
("pas de généralisation avant un appelant réel").

## Justification

Découplage du reste du système vis-à-vis d'un fournisseur non encore
vérifié — le cahier des charges identifie lui-même ce risque (§12.1). Deux
flux distincts (loyers, abonnements) consommeront la même interface,
chacun avec son propre `PaymentInitiationRequest.purpose`.

## Conséquences

- Le `providerReference` retourné par `initiate()` est la seule donnée
  Djomy stockée en base à long terme (`Payment.providerReference`, unique
  globalement) — jamais de détail de carte ou de compte mobile money.
- Une tâche planifiée de réconciliation (`checkStatus`) doit exister dès la
  Phase 3, pas différée — voir
  `darmeuble-kit/docs/backend/paiements-djomy.md` §"Le risque que le
  cahier des charges identifie lui-même".
- Toute confirmation de paiement passe par le motif finalizeTransaction
  (`updateMany` gardé par condition de statut, règle ESLint
  `darmeuble/require-status-condition-on-write`) — voir le gabarit déjà
  appliqué à la rotation de refresh token
  (`prisma-auth.repository.ts::claimRefreshToken`).
- `Payment.method: 'djomy' | 'cash' | 'bank_transfer'` dès le schéma de
  départ (`prisma/schema.prisma`) — le paiement manuel reste disponible en
  permanence, pas un repli provisoire.

## Alternatives écartées

**Appeler l'API Djomy directement depuis `PaymentsService`/`SubscriptionsService`.**
Couplerait deux modules métier distincts à un fournisseur externe non
encore vérifié.
