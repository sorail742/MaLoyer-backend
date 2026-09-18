# ADR-0004 — Authentification : access/refresh token avec rotation

## Statut

Accepté — implémenté (`src/modules/auth/`).

## Contexte

Le cahier des charges (§6.4) demande une "authentification sécurisée (mot
de passe hashé, JWT, éventuellement OTP par SMS pour les locataires)" sans
trancher la durée de vie ni le mécanisme de renouvellement. Deux modèles
existent chez les projets frères : `Oumra-hadj-project` (refresh JWT
signé, plus simple), `smartsms-backend` (refresh opaque haché avec
rotation et détection de réutilisation, plus robuste).

## Décision

**Un couple access token (court) / refresh token (long, rotatif) par
session**, sur le modèle de `smartsms-backend` :

- **Access token** — JWT signé, 15 minutes par défaut
  (`JWT_ACCESS_EXPIRES_IN`), porté par `Authorization: Bearer`. Payload :
  `{ sub, sid, role, organizationId }` (voir
  `src/modules/auth/strategies/jwt.strategy.ts::JwtPayload`) — `role` et
  `organizationId` ajoutés au-delà du couple minimal `{sub, sid}` décrit
  initialement, conformément à la règle "s'il manque un champ, l'ajouter
  au payload JWT, jamais réinjecter un repository utilisateur dans un
  service qui n'en a pas besoin autrement" (`darmeuble-kit/docs/backend/multi-tenant.md`).
- **Refresh token** — valeur aléatoire opaque (`randomBytes(64)`, voir
  `src/modules/auth/tokens.service.ts`), jamais un JWT. Hachée en SHA-256
  avant stockage (`src/modules/auth/auth.util.ts::sha256Hex`). Durée de vie
  7 jours par défaut, déposée par le **backend** dans un cookie `httpOnly`
  + `secure` + `sameSite=lax` (`REFRESH_TOKEN_COOKIE_NAME`, défaut
  `darmeuble_refresh_token` — voir `src/config/configuration.ts`).
- Chaque refresh token est rattaché à une session révocable (`UserSession`,
  `onDelete: Cascade` sur `RefreshToken`).
- `POST /api/auth/refresh` réclame le token atomiquement
  (`updateMany` gardé par `usedAt: null`, voir
  `src/modules/auth/repositories/prisma-auth.repository.ts::claimRefreshToken`).
  Une réclamation qui échoue sur un token déjà marqué `usedAt` **révoque la
  session entière** (`AuthService.refresh`), pas seulement la requête —
  testé explicitement (`auth.service.spec.ts`, cas "reused").

**Deux parcours de connexion**, comme au cahier des charges §6.4 et §9.2 :
`POST /api/auth/login` (email + mot de passe) et
`POST /api/auth/otp/request` + `POST /api/auth/otp/verify` (téléphone +
code SMS, locataire). Les deux émettent le même couple de jetons par un
chemin unique (`TokensService.issueAuthResult`).

## Justification

Identique au raisonnement du kit de démarrage : le coût d'une session
volée est plus élevé pour MaLoyer (paiements de loyer, abonnements
facturables) que pour un contexte où le pire cas est une session
compromise sans conséquence financière directe. La détection de
réutilisation (impossible avec un JWT signé classique) justifie le coût
d'implémentation supplémentaire.

**Pourquoi le backend pose le cookie du refresh token lui-même.** Réduit
le nombre d'endroits où la valeur en clair est manipulée — jamais dans un
corps de réponse JSON, même lu côté serveur par le proxy Next.js de
`darmeuble-frontend` (voir son ADR-0002 propre).

## Conséquences

- `RefreshToken`/`UserSession` (catégorie C, voir ADR-0006) : cycle de vie
  par expiration/révocation, pas de soft delete.
- `cookie-parser` au boot (`src/main.ts`) pour lire le cookie refresh sur
  `/api/auth/refresh`.
- Le frontend (`darmeuble-frontend`) sérialise ses appels de renouvellement
  (un seul en vol par processus serveur, voir
  `darmeuble-frontend/src/lib/auth/refresh.ts`) — le backend ne traite pas
  deux appels concurrents sur le même refresh token avec indulgence.
- OTP : code numérique haché en SHA-256, `OtpCode.attempts` limité
  (`OTP_MAX_ATTEMPTS`), `POST /api/auth/otp/request` ne révèle jamais si le
  numéro correspond à un compte réel (`AuthService.requestOtp`) — pas
  d'énumération de comptes.

## Alternatives écartées

**Refresh JWT signé, comme Oumra-hadj-project.** Pas de détection de
réutilisation — écarté vu la nature financière du projet.

**Refresh token en JSON, cookie posé par le proxy Next.js.** Écarté pour
minimiser le nombre d'endroits où la valeur en clair est manipulée.

**Une table `TokenFamily` séparée de la session.** La session remplit déjà
ce rôle.
