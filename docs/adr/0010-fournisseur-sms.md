# ADR-0010 — Fournisseur SMS

## Statut

Proposé — bloqué sur un choix produit, pas une décision technique interne.

## Contexte

Le cahier des charges (§12.3) formule comme hypothèse qu'"un fournisseur de
SMS local sera choisi et intégré" pour l'OTP locataire (§6.4) et les
notifications (§5.8 : rappels d'échéance, alertes de retard, annonces).
Aucun fournisseur n'a été choisi à ce jour.

## Ce qui bloque

L'envoi réel de SMS — OTP locataire (`POST /api/auth/otp/request`) et,
plus tard, le module `notifications` (Phase 5).

## Ce qui ne bloque pas

`ConsoleSmsSender` (`src/modules/auth/sms/console-sms-sender.service.ts`,
interface `SmsSender`) journalise le code OTP au lieu de l'envoyer,
avertissement explicite "DEV ONLY" — permet de développer et tester tout
le parcours OTP (génération, hachage, expiration, limitation des
tentatives) sans fournisseur réel.

## Décision à prendre (par le porteur produit)

- Fournisseur SMS local adapté au contexte guinéen (fiabilité, coût,
  couverture réseau) — hors périmètre technique de cet ADR.
- Format réel du message et contraintes (longueur, encodage GSM-7/Unicode)
  du fournisseur choisi.

## Conséquences une fois tranché

Ajouter une implémentation `<Fournisseur>SmsSender implements SmsSender`
dans `src/modules/auth/sms/`, la câbler dans `AuthModule` (factory déjà
prête à changer de branche selon `SMS_PROVIDER`, voir `auth.module.ts`) —
sans changer l'interface `SmsSender` ni `AuthService`. Le module
`notifications` (Phase 5) réutilisera la même interface pour les
rappels/alertes, pas une deuxième intégration SMS séparée.
