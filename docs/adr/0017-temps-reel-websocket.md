# ADR-0017 — Temps réel : WebSocket (Socket.IO)

## Statut

Accepté (infrastructure) — aucun événement métier défini par cet ADR, voir
« Ce que cet ADR ne fait pas ».

## Contexte

Le cahier des charges prévoit des notifications in-app (§5.8/§5.9, Phase
5) — un canal qui, par nature, doit pousser une information au client sans
qu'il la redemande par polling. Aucun module métier ne consomme encore ce
canal (`notifications` n'existe pas avant Phase 5), mais l'infrastructure
de connexion doit exister avant lui, même raisonnement que
`PaymentProvider`/`StorageProvider` (ADR-0005/0016).

## Décision

1. **Socket.IO** (`@nestjs/websockets` + `@nestjs/platform-socket.io`),
   pas les WebSockets natifs bruts — reconnexion automatique et repli sur
   long-polling déjà gérés, pertinent vu les contraintes de connectivité
   du contexte guinéen (ADR-0014, point 5) : une coupure réseau brève ne
   doit pas exiger une reconnexion manuelle côté client.
2. **Authentification au handshake, jamais après coup.** Le client passe
   son access token via `socket.handshake.auth.token` (ou l'en-tête
   `Authorization: Bearer`, en repli). `RealtimeGateway.handleConnection`
   vérifie le token avec `JwtService.verify` (même secret que
   `JwtStrategy`, voir ADR-0004) et déconnecte immédiatement toute
   connexion sans token valide — jamais une connexion "anonyme" qui
   s'authentifie plus tard.
3. **Isolation multi-tenant par room** (`org:${organizationId}`,
   `realtime.rooms.ts`) — même principe que le filtre `organizationId`
   HTTP (ADR-0002), transposé au temps réel : un événement émis pour une
   organisation n'atteint jamais un socket connecté sous une autre
   organisation. Un utilisateur sans organisation (super admin,
   `organizationId: null`) n'est connecté à aucune room pour l'instant —
   pas de diffusion transverse le concernant tant qu'un besoin réel
   n'existe pas.
4. **`RealtimeService.emitToOrganization(...)` comme unique point d'entrée**
   pour tout module métier qui pousse un événement — jamais d'injection
   directe de `RealtimeGateway`/`@WebSocketServer()` ailleurs, pour ne pas
   disperser la connaissance de la structure des rooms.
5. **`RealtimeModule` global, câblé dans `AppModule` dès maintenant** —
   le gateway existe et accepte des connexions même si personne ne pousse
   encore d'événement métier dessus.

## Ce que cet ADR ne fait pas

**Ne définit aucun nom d'événement ni forme de payload.** Deviner les
événements du futur module `notifications` avant qu'il existe reviendrait
à figer une décision métier non prise — voir AGENTS.md « Choisir quel
ticket travailler (priorité) » et le même principe déjà appliqué à
`PaymentProvider`/`SmsSender`. Le module qui consommera
`RealtimeService.emitToOrganization` définira ses propres événements en
temps voulu.

## Justification

Le pattern repository/port-adapter (ADR-0003) transposé au temps réel :
`RealtimeService` est le seul point d'entrée pour un module métier, la
mécanique de room reste un détail d'implémentation caché derrière lui.

## Conséquences

- Tout module qui pousse un événement temps réel importe
  `RealtimeService`, jamais `RealtimeGateway` directement.
- Le namespace Socket.IO est fixé à `/realtime` — un futur besoin de
  namespaces multiples (ex. séparer notifications et un futur chat) se
  déciderait dans un nouvel ADR, pas en modifiant celui-ci après coup pour
  une organisation déjà en place.

## Alternatives écartées

**Server-Sent Events (SSE).** Écarté : unidirectionnel, alors qu'un futur
besoin (ex. présence, accusé de lecture) pourrait demander une
communication client→serveur sur le même canal — Socket.IO couvre les deux
sans decision à reprendre plus tard pour un coût d'infrastructure
similaire.

**Polling court côté frontend (pas de WebSocket du tout).** Écarté :
demande explicite de l'utilisateur ("utilisation socket"), et moins
efficace sur une connectivité déjà contrainte (ADR-0014) — chaque poll est
une requête HTTP complète là où une connexion WebSocket persistante n'a
qu'un coût d'établissement.
