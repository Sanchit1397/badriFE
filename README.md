# BadrikiDukan MVP

A modular, scalable MVP for a local stationery shop with delivery.

## Tech Stack
- Next.js (App Router) + TypeScript
- Tailwind CSS
- MongoDB + Mongoose
- JWT auth (httpOnly cookie)
- Zustand/Redux (client state), React Query (server state)
- Zod validation

## Getting Started
1. Copy `.env.example` to `.env.local` and fill values.
2. Set `NEXT_PUBLIC_API_URL` to your backend URL (e.g., `http://localhost:4000`).
3. Install deps and run dev (frontend only; backend runs separately):

```bash
npm install
npm run dev
```

## Structure
```
src/
  app/
    (public)/
      (home)/page.tsx
      auth/
        login/page.tsx
        register/page.tsx
      cart/page.tsx
      profile/page.tsx
      products/page.tsx
    (admin)/
      admin/page.tsx
    api/
      auth/route.ts
      products/route.ts
      categories/route.ts
      orders/route.ts
  lib/
    db.ts
    auth.ts
    validators.ts
  models/
    User.ts
    Product.ts
    Category.ts
    Order.ts
    Cart.ts
  middleware/
    auth.ts
    rbac.ts
  store/
    auth.ts
    cart.ts
```

## First Admin User
- On first run, if admin user doesn’t exist, create one using `ADMIN_DEFAULT_EMAIL` and `ADMIN_DEFAULT_PASSWORD`.

## Scripts
- `npm run dev` - start dev server (frontend)
- `npm run build` - build
- `npm run start` - start production

## Notes
- This MVP ships with COD-only ordering.
- Designed to add payments, inventory, notifications later.

## Docker (Docker Desktop)
Dev stack uses docker-compose to run: web (Next.js dev), MongoDB, Redis, Mongo Express.

Commands (run from repo root):

```bash
# start dev stack (hot reload) on http://localhost:3000
docker compose up -d

# follow logs (all services)
docker compose logs -f

# stop stack
docker compose down

# start only dbs (useful if running web locally)
docker compose up -d mongo redis mongo-express

# open Mongo Express: http://localhost:8081
```

Environment used by Compose:
- Web env is in `docker-compose.yml` (overrides app defaults)
- DB URI inside containers: `mongodb://mongo:27017/badrikidukan`

Prod image (optional):

```bash
# build optimized image defined by web/Dockerfile
docker compose --profile prod build web-prod

# run prod container (depends on mongo/redis)
docker compose --profile prod up -d mongo redis web-prod
```

Shell inside the web container:

```bash
docker compose exec web sh
```
