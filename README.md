# Manifeed Frontend

Repo frontend Next.js de Manifeed. Il contient la landing publique, les parcours `login/signup`, les pages user `/profile`, `/sources`, `/workers`, `/api-keys` et l'espace `admin` pour la console d'administration.

## Demarrage local

```bash
yarn install
BACKEND_INTERNAL_URL=http://127.0.0.1:8000 yarn dev
```

`BACKEND_INTERNAL_URL` ne sert qu'au SSR Next, mais il pointe maintenant vers les memes routes
publiques canoniques que le navigateur :

- `/api/auth/*`
- `/api/account/*`
- `/api/admin/*`
- `/api/sources/*`
- `/workers/api/*`

Le navigateur passe par l'edge Nginx expose par `../infra`, sans rewrite applicatif.

Autres commandes :

```bash
yarn build
yarn start
yarn typecheck
```

## Structure

- `src/app/` : routes App Router
- `src/components/` : primitives et layout
- `src/features/` : logique UI par domaine
- `src/services/api/` : client HTTP
- `src/types/` : contrats TypeScript consommes par l'UI

## Tests

Le frontend n'a pas de suite de tests unitaires dediee. La validation locale repose sur :

- `yarn typecheck` pour le typage TypeScript
- `yarn build` pour la compilation Next.js

Les contrats HTTP sont couverts cote `../public_api/tests`.

## Place dans le multi-repo

- `../infra` fournit la stack Docker locale et expose `BACKEND_INTERNAL_URL_ADMIN`.
- `../public_api` expose le contrat HTTP public consomme par le frontend.
- `src/types/` reste pour l'instant la projection locale des contrats cote frontend.
