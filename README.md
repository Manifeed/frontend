# Manifeed Frontend Admin

Repo frontend de la console d'administration Manifeed. Il contient l'application Next.js utilisee pour piloter le backend, suivre les jobs et observer les workers.

## Demarrage local

```bash
yarn install
NEXT_PUBLIC_API_URL=http://localhost:8000 yarn dev
```

Autres commandes :

```bash
yarn build
yarn start
```

## Structure

- `src/app/` : routes App Router
- `src/components/` : primitives et layout
- `src/features/` : logique UI par domaine
- `src/services/api/` : client HTTP
- `src/types/` : contrats TypeScript consommes par l'UI

## Place dans le multi-repo

- `../infra` fournit la stack Docker locale et expose `NEXT_PUBLIC_API_URL_ADMIN`.
- `../api` stocke `openapi.json`, la source de verite publiee pour le contrat backend.
- `src/types/` reste pour l'instant la projection locale des contrats cote frontend.
