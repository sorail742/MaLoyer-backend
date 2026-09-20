#!/bin/sh
# Applique les migrations en attente avant de démarrer le serveur — voir
# ADR-0015. `prisma migrate deploy` est sûr en exécution concurrente
# (verrou consultatif interne à Prisma) : pas de coordination
# supplémentaire nécessaire même avec plusieurs réplicas au démarrage.
set -e

npx prisma migrate deploy

exec "$@"
