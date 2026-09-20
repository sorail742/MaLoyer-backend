# syntax=docker/dockerfile:1
#
# MaLoyer backend — image de production (ADR-0015).
#
# Une seule image, pas de découpage multi-stage à grain fin par type de
# dépendance : la CLI Prisma (devDependency) reste dans l'image finale pour
# que `prisma migrate deploy` (docker-entrypoint.sh) s'exécute au démarrage
# du conteneur — plus simple à opérer qu'un conteneur d'init séparé pour un
# déploiement mono-VPS (voir ADR-0015), au prix de quelques dizaines de Mo
# superflus. Prisma 7 + @prisma/adapter-pg (src/prisma/prisma.service.ts) :
# les requêtes passent par `pg`, pas par un moteur binaire natif — seule la
# génération du client (étape `build`) a besoin des outils Prisma.

FROM node:24.21.0-alpine AS build
WORKDIR /app
# prisma.config.ts + prisma/ copiés avant `npm ci` : le hook `postinstall`
# (`prisma generate`) a besoin du schéma, pas seulement de package.json —
# sacrifie un peu de granularité de cache (un changement dans prisma/
# invalide aussi la couche `npm ci`) contre un `npm ci` qui fonctionne.
COPY package.json package-lock.json prisma.config.ts ./
COPY prisma ./prisma
RUN npm ci
COPY . .
RUN npm run build

FROM node:24.21.0-alpine AS runtime
ENV NODE_ENV=production
WORKDIR /app

RUN addgroup -S maloyer && adduser -S maloyer -G maloyer

COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY --from=build /app/src/generated ./src/generated
COPY --from=build /app/package.json ./package.json
COPY --from=build /app/prisma ./prisma
COPY --from=build /app/prisma.config.ts ./prisma.config.ts
COPY docker-entrypoint.sh /usr/local/bin/docker-entrypoint.sh

RUN chmod +x /usr/local/bin/docker-entrypoint.sh \
  && chown -R maloyer:maloyer /app

USER maloyer
EXPOSE 3000
ENTRYPOINT ["docker-entrypoint.sh"]
CMD ["node", "dist/main.js"]
