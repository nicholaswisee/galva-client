# Galva ERP — Client

The Account Payable PWA for the Galva ERP mockup. A single-page,
offline-capable web client that talks to the
[GalvaERP API](../galva-api/GalvaERP/README.md) and reads/writes
against the seeded [`ErpApMockup`](../galva-db/README.md) database.

The UI covers the full P2P flow:

```
Dashboard  →  Purchase Requisitions (PR)  →  Purchase Orders (PO)
            →  PO Confirmations             →  Goods Receipts (GR)
            →  AP Invoices                  →  Payments
            →  Purchase Returns (optional)  →  Master Data (reference)
```

## Tech stack

| Concern              | Choice                                            | Why                                                                                                                                            |
| -------------------- | ------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| Bundler / dev server | [Vite 8](https://vite.dev)                        | Fast HMR, native ESM, first-class PWA support.                                                                                                 |
| Framework            | React 19 + TypeScript 6                           | Server-component-free SPA.                                                                                                                     |
| Router               | [TanStack Router](https://tanstack.com/router) v1 | File-based-style route trees with strict typing of route params, search params, and loaders.                                                   |
| Data fetching        | [TanStack Query](https://tanstack.com/query) v5   | Server-state cache, stale-while-revalidate, automatic retries. Persisted to `sessionStorage` so navigating away and back keeps the cache warm. |
| UI                   | shadcn/ui + Radix UI + Tailwind CSS v4            | Accessible primitives, copy-paste components in `src/components/ui/`.                                                                          |
| Icons                | [lucide-react](https://lucide.dev)                | Tree-shakable SVG icons.                                                                                                                       |
| PWA                  | `vite-plugin-pwa` + Workbox                       | Service worker, install prompt, offline shell.                                                                                                 |
| Form / data helpers  | `clsx`, `tailwind-merge`, `idb-keyval`            | Class composition and IndexedDB key-value store (reserved for client-side caches).                                                             |
| Package manager      | [Bun](https://bun.sh)                             | Lockfile is `bun.lock`. `npm`/`pnpm` also work.                                                                                                |

## Quick start

```bash
# 1. Make sure the API + DB are running (see ../galva-db/README.md)
#    The API should be reachable at the URL in .env.local
#    (default: http://localhost:5132)

# 2. Install
bun install            # or: npm install

# 3. Run the dev server
bun run dev            # → http://localhost:5173

# 4. Sign in
#    Default credentials seeded by the API on first boot:
#    username: admin   password: admin123
```

The dev server reads `.env.local`. The committed `.env.local` points to
`http://localhost:5132` — adjust if the API is on a different host/port.

## Scripts

| Command           | What it does                                                                                                                    |
| ----------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| `bun run dev`     | Start Vite dev server on port 5173. Service worker is enabled (`devOptions.enabled: true`) so PWA features are testable in dev. |
| `bun run test`    | Run the Vitest unit suite for API helpers, schemas, and return calculations.                                                       |
| `bun run build`   | `tsc -b && vite build` — type-check then bundle to `dist/`.                                                                     |
| `bun run preview` | Serve the production build locally.                                                                                             |
| `bun run lint`    | ESLint with TypeScript + React hooks rules.                                                                                     |

## Environment variables

Only one variable is read at build time:

| Variable       | Default                 | Effect                                                                                                             |
| -------------- | ----------------------- | ------------------------------------------------------------------------------------------------------------------ |
| `VITE_API_URL` | `http://localhost:5132` | Base URL of the GalvaERP API. Read once at module load (`src/lib/api.ts`). Change in `.env.local` per environment. |

The CORS allow-list on the API is configured for
`http://localhost:5173` and `http://localhost:5132` (see
[API README → CORS](../galva-api/GalvaERP/README.md#cors)). If you
change the dev port, update the API's `appsettings.json` too.

## Project layout

```
src/
├── main.tsx              Boot: mounts <StrictMode> + Query + Auth + Router
├── router.tsx            TanStack Router route tree (typed)
├── index.css             Tailwind v4 + shadcn theme tokens
├── types.ts              DTO types that mirror the API's response shapes
│
├── lib/
│   ├── api.ts            fetch() wrapper: JWT, refresh-on-401, idempotency
│   ├── auth.tsx          AuthProvider + useAuth() hook
│   ├── push.ts           VAPID-based web push subscribe / unsubscribe
│   ├── query-client.tsx  QueryClient factory (staleTime 60s, persist to session)
│   ├── use-master-data.ts React Query hooks for /api/master-data/*
│   └── utils.ts          cn() = clsx + tailwind-merge
│
├── components/
│   ├── layout/           DashboardLayout (sidebar, header, nav sections)
│   ├── ui/               shadcn/ui primitives (Button, Card, Dialog, …)
│   ├── data-select.tsx   <DataSelect> wrapper around Radix Select
│   └── status-badge.tsx  Maps status codes to <Badge variant>
│
└── pages/
    ├── LoginPage.tsx
    ├── DashboardPage.tsx
    ├── MasterDataPage.tsx
    ├── pr/               PRList, PRCreate, PRDetail
    ├── po/               POList, POCreate
    ├── gr/               GRList, GRCreate
    └── invoice/          InvoiceList, InvoiceCreate
```

## Auth & API access

`src/lib/api.ts` is a thin fetch wrapper that handles the three
policies the API enforces:

1. **Bearer token.** The access token is kept in module-scope memory
   (cleared on full page reload) and attached as
   `Authorization: Bearer <token>` on every request.
2. **Refresh on 401.** When a request returns 401 and the caller
   hasn't already retried, the wrapper hits `POST /api/auth/refresh`
   (refresh token is in an httpOnly cookie set by the API). If the
   refresh succeeds, the original request is replayed with a
   `X-Retry: 1` marker so it's not retried twice. If the refresh
   fails, the user is effectively logged out.
3. **Idempotency on POST.** Every `api.post()` call auto-generates
   an `Idempotency-Key: <uuid>` header. The API caches the response
   for 24h, so accidental double-clicks (or page reloads during a
   pending POST) are deduped server-side.

`AuthProvider` (in `src/lib/auth.tsx`) exposes
`isAuthenticated`, `login()`, and `logout()`. On mount, it calls
`/api/auth/refresh` to try a silent session restore from the cookie.

`AuthGuard` (in `router.tsx`) wraps the dashboard route tree and
redirects unauthenticated visits to `/in` with a `?redirect=…`
search param so the user lands back where they tried to go after
signing in.

## Routing

All routes are declared in `src/router.tsx` using TanStack Router's
code-based API. The tree is fully type-safe — `useParams()` returns
the exact shape of the path parameters declared on the route, and
typed search params are a first-class concept.

```
/in                                    (anonymous) LoginPage
/                                      (auth) DashboardPage
/pr, /pr/new, /pr/$id                  Purchase requisitions
/po, /po/new, /po/$id, /po/$id/print   Purchase orders
/po-confirm, /po-confirm/new, /po-confirm/$id
                                      PO confirmations
/gr, /gr/new, /gr/$id                  Goods receipts
/invoices, /invoices/new, /invoices/$id
                                      AP invoices
/invoices/po-based/new                 PO-based AP invoice
/payments, /payments/new, /payments/$doku
                                      Payments
/returns, /returns/new, /returns/$doku Purchase returns
/md                                    Master data
```

`defaultPreload: "intent"` means routes start loading their
data the moment a link is hovered, so navigations feel instant.

## P2P flow in the UI

The screens mirror the API's entity model one-to-one:

| Screen         | API endpoints used                                                         |
| -------------- | -------------------------------------------------------------------------- |
| PR list        | `GET /api/purchase-requisitions`                                           |
| PR detail      | `GET /api/purchase-requisitions/{doku}` (returns ETag)                     |
| PR create      | `POST /api/purchase-requisitions` (auto-generates Doku `SPB-YYYYMMDD-NNN`) |
| PO list        | `GET /api/purchase-orders`                                                 |
| PO create      | `POST /api/purchase-orders` (auto-generates Doku `PO-YYYYMMDD-NNN`)        |
| PO confirmations | `GET/POST /api/po-confirmations`, `GET /api/po-confirmations/{doku}`     |
| GR list        | `GET /api/goods-receipts`                                                  |
| GR create      | `POST /api/goods-receipts`                                                 |
| Invoice list   | `GET /api/invoices`                                                        |
| Invoice create | `POST /api/invoices`                                                       |
| Payments       | `GET/POST /api/payments`, `GET/PUT /api/payments/{doku}`                   |
| Purchase returns | `GET/POST /api/purchase-returns`, `GET/PUT/DELETE /api/purchase-returns/{doku}` |
| Master data    | `GET /api/master-data/{vendors,departments,inventory,warehouses,banks}`    |

Concurrency: the API returns `ETag` headers on every read. PR, PO, and return
updates use `If-Match: <base64-etag>`; GR and invoice update DTOs carry their
ETag in the request body. Deletes use `If-Match`.

## PWA / offline

Configured by `VitePWA` in `vite.config.ts`:

- **Register type:** `prompt` — the app shows an install banner but
  doesn't auto-register. The user clicks the prompt to install.
- **Dev mode:** the service worker is **enabled** during
  development so you can test install/offline flows without a
  production build.
- **Manifest:** declares the icons, theme color (`#0f172a`),
  display mode (`standalone`), and start URL.
- **Workbox precache:** the app shell (`**/*.{js,css,html,ico,png,svg,woff2}`)
  is precached on install, and `navigateFallback: "index.html"`
  ensures SPA routing works after a hard refresh while offline.

To test offline: build the app, serve it with `bun run preview`,
install it, then toggle the browser to "Offline" in DevTools and
revisit any already-loaded page.

## Web push

`src/lib/push.ts` calls `GET /api/push/vapid-public-key`, subscribes
to the browser's `PushManager` with the returned VAPID public key,
and posts the subscription back to `POST /api/push/subscribe`.

The API only stores one subscription per user; calling subscribe
again overwrites the prior one. Unsubscribe is a single
`DELETE /api/push/subscribe`. To send a test notification:
`POST /api/push/test` (auth required).

## Type contracts

`src/types.ts` is the single source of truth for what the UI expects
from the API. It mirrors the API's `PODetailDto`, `GRListDto`, etc.
If the API changes a field name, the TypeScript compiler will
flag every consumer. The naming is intentionally lowerCamelCase
on the client side and PascalCase on the C# side — the API serializes
`PODetailDto.Nilai` as `nilai`, and the client type asserts the same.

## Common tasks

**Run against a different API host**

Edit `.env.local` and set `VITE_API_URL=https://api-staging.galva.local`,
then restart `bun run dev`.

**Clear the service worker** (after a manifest change)

DevTools → Application → Service Workers → Unregister. Or in code:
`await navigator.serviceWorker.getRegistrations().then(rs => rs.forEach(r => r.unregister()))`.

**Add a new shadcn component**

```bash
bunx --bun shadcn@latest add dropdown-menu
```

The component lands in `src/components/ui/`. The `components.json`
file at the repo root is pre-configured for the `@/components/ui/`
alias.

**Add a new page**

1. Create the component in `src/pages/<area>/<Name>Page.tsx`.
2. Add a route in `src/router.tsx` under the `dashboardLayoutRoute`
   parent so it inherits the auth guard and layout.
3. Add a nav link in `src/components/layout/DashboardLayout.tsx` —
   pick a [lucide-react](https://lucide.dev) icon and add an entry
   in the appropriate `navSections` group.

## Roadmap

Things deliberately not built yet but obvious next steps:

- Detail screens for PO/GR/Invoice (the PR side has one — extend the
  pattern).
- Edit flows that send `If-Match: <etag>` for ETag-based concurrency.
- P2P chain view on the dashboard (PO → GR → Voucher → Payment).
- An offline write queue for PWA — POSTs attempted while offline
  are persisted in IndexedDB and replayed on reconnect.

## Related docs

- [API README](../galva-api/GalvaERP/README.md) — endpoints, auth,
  idempotency, ETag, and how to run the API locally.
- [Database README](../galva-db/README.md) — Docker setup, schema,
  and the seed-from-prod pipeline.
