# ADR-0016 — Stockage objet : MinIO auto-hébergé

## Statut

Accepté.

## Contexte

Plusieurs fonctionnalités à venir manipulent des fichiers : photos
d'immeuble/unité, documents locataire (pièce d'identité, voir cahier des
charges §5.2), bail PDF généré (§5.3), quittances/reçus PDF (§5.5). Aucun
module métier ne les consomme encore (Phase 2/3), mais l'infrastructure de
stockage doit exister avant eux, comme `PaymentProvider`/`SmsSender`
existent avant les modules qui les consomment.

Contrairement à Djomy/SMS (ADR-0009/0010, décisions produit encore
ouvertes), le choix du stockage objet est une décision **technique**, pas
une décision produit — elle n'a pas besoin d'attendre un tiers externe.

## Décision

1. **MinIO auto-hébergé**, pas un service cloud managé (S3 AWS, DO
   Spaces, Scaleway). Raisons spécifiques au contexte guinéen/africain
   (ADR-0014) :
   - **Coût** : facturation cloud en devise étrangère (USD/EUR),
     dépendante d'une carte bancaire internationale — friction réelle pour
     une plateforme facturée en GNF à des clients locaux. Un stockage
     auto-hébergé sur le même VPS que le backend (ADR-0015) n'ajoute pas
     de dépendance de paiement externe supplémentaire, en plus de Djomy.
   - **Latence/fiabilité** : un objet stocké sur le même réseau local que
     le backend (même VPS ou même datacenter régional) évite un aller-retour
     vers un cloud occidental, pertinent vu les contraintes de
     connectivité déjà actées (ADR-0014, point 5).
   - **Compatibilité S3** : si un vrai besoin de migration vers un cloud
     managé apparaît plus tard (montée en charge, réplication
     géographique), l'API S3 de MinIO rend la bascule mécanique — pas un
     verrouillage propriétaire.
2. **Bucket unique (`maloyer`), clé préfixée par `organizationId`** — pas
   un bucket par organisation (ne passerait pas à l'échelle avec MinIO,
   voir sa documentation sur les limites de buckets). L'isolation
   multi-tenant (ADR-0002) est portée par le préfixe de clé **et** par le
   contrôle d'accès applicatif : `StorageProvider` ne connaît pas
   l'utilisateur courant, c'est au module appelant de ne jamais émettre
   une URL signée pour un objet hors de l'organisation de l'appelant.
3. **URLs signées à durée limitée**, jamais d'objet public par défaut —
   les documents locataire sont des données personnelles (cahier des
   charges §8, confidentialité).
4. **Connexion paresseuse** (bucket créé au premier upload, pas au
   démarrage du module) — même principe que `PrismaService` : l'
   application ne doit pas échouer au démarrage si MinIO n'est pas encore
   joignable.
5. **`StorageModule` global, câblé dans `AppModule` dès maintenant**
   (contrairement à `PaymentsModule`, qui attend la décision Djomy) —
   MinIO n'est pas une décision en attente.

## Justification

Le pattern port/adapter (ADR-0003) s'applique même à une décision "ferme" :
`StorageProvider` reste une interface, `MinioStorageProvider` son unique
implémentation — un futur module métier ne dépend jamais du SDK MinIO
directement, seulement du contrat.

## Conséquences

- Toute nouvelle fonctionnalité de fichier (photo, document, PDF généré)
  injecte `STORAGE_PROVIDER`, jamais le SDK `minio` directement.
- `npm audit` signale des vulnérabilités transitives modérées/hautes via
  les dépendances du SDK `minio` (`query-string`/`decode-uri-component`/
  `stream-json`, classes DoS) — la version la plus récente du SDK
  (`8.0.7`, vérifiée le 2026-09-19) les porte encore ; corrigées à la
  prochaine version du SDK qui les résout, pas en rétrogradant vers une
  version majeure antérieure qui perdrait des fonctionnalités pour un
  gain de sécurité marginal (surface d'attaque réelle limitée : ces
  fonctions traitent des entrées internes au backend, pas une entrée
  utilisateur non filtrée).
- MinIO n'est distribué que sous `quay.io/minio/minio`, plus sous
  `minio/minio` (Docker Hub) pour les versions récentes — vérifié
  directement le 2026-09-19 (`docker pull minio/minio` refuse l'accès).
  Ne pas réintroduire `minio/minio` dans `docker-compose.yml` en pensant
  corriger une régression.

## Alternatives écartées

**AWS S3 / DigitalOcean Spaces / Scaleway Object Storage.** Écartés pour
les raisons de coût/latence ci-dessus, pas définitivement — l'API S3
compatible de MinIO garde la porte ouverte si le contexte change
(croissance, besoin de réplication géographique que MinIO auto-hébergé sur
un seul VPS ne couvre pas).

**Stockage sur disque local du serveur (pas d'objet du tout).** Écarté :
pas de réplication, perte totale en cas de panne disque, pas de
compatibilité S3 pour une migration future — MinIO reste simple à opérer
pour le bénéfice obtenu.
