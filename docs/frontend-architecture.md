# Stay frontend architecture

Design source of truth: `docs/design/png/*.png` (rendered boards) and `docs/design/boards/*.html`
(readable markup with exact inline styles). `docs/ui-design.html` is the original bundled export.
API source of truth: `docs/api-contract.md`.

## Stack

| Concern | Choice | Why |
|---|---|---|
| Build | Vite 8 + React 19 + TypeScript 6 | Existing scaffold |
| Routing | React Router 8, data mode (`createBrowserRouter`) | Standard; paths in `src/app/routes.ts` |
| Server state | TanStack Query 5 | Caching, dedupe, invalidation after mutations |
| Styling | CSS Modules + tokens in `src/styles/tokens.css` | 1:1 with the design's exact values |
| Motion | `motion` (import from `motion/react`) | Camera moves, shared-element transitions |
| Auth | Supabase JS (email + password) | Backend verifies the JWT |
| Fonts | `@fontsource` Cormorant Garamond + Jost, self-hosted | No runtime Google Fonts dependency |
| Tests | Vitest + Testing Library (unit), Playwright (E2E) | |

## Layout

```
src/
  app/        router.tsx, routes.ts (paths), RootLayout.tsx (transitions), RequireAuth.tsx, queryClient.ts
  api/        client.ts (fetch + token + ApiError), endpoints.ts (one fn per endpoint), types.ts (contract mirror),
              queryKeys.ts, catalog.ts / me.ts (shared hooks)
  auth/       AuthProvider.tsx (Supabase session)
  art/        Buddha.tsx, icons.tsx - SVG art shared across features (feature-only art lives in the feature)
  catalog/    practice.ts - labels/copy/order for modes, intents, objects keyed by API slug
  lib/        format.ts (durations, tenure, dates), supabase.ts
  styles/     tokens.css, global.css, fonts.ts
  ui/         Screen, TopBar, Button/ButtonLink, Text (Eyebrow/Title/Lead/Quote/SectionLabel), Tabs, Field/TextArea,
              Avatar, Chip, MainNav, States (Loading/ErrorState)
  features/
    auth/     SignInScreen
    home/     HomeScreen
    practice/ Mode/Intention/Object screens + flow draft
    session/  SessionScreen (scenes: buddha, fire, still), SessionCompleteScreen
    you/      YouScreen (My practice)
    circle/   Discussion, Hours, Compose, Thread, SharedSitting, Practitioner
e2e/          Playwright specs (+ auth.setup.ts)
```

## Conventions

- **Tokens only.** Colours, fonts and radii come from `var(--token)`. Raw hex is allowed only inside SVG illustrations.
- **Match the boards exactly** at 390x844: padding `56px 28px 38px`, sizes, letter-spacing, colours. Compare with
  `node scripts/screenshot.mjs <url> out.png --auth` against `docs/design/png`.
- **Every screen renders one `<Screen>`**; bottom-pinned actions follow a `<Spacer />`.
- **Links use `paths` from `src/app/routes.ts`**, never hand-built strings.
- **Data access:** feature hooks wrap `endpoints.ts` with TanStack Query in `features/<x>/queries.ts`, using
  `queryKeys`. Mutations invalidate the keys they affect (e.g. completing a session invalidates `me`, `myStats`,
  `sessions`, `hours`).
- **Presentation catalog:** labels/copy for modes, intents and objects come from `src/catalog/practice.ts`, joined to
  API ids by slug. Never show raw API names like "Buddha Recollection".
- **Accessibility:** 44px minimum tap targets, visible `:focus-visible`, labelled icon buttons, `prefers-reduced-motion`
  respected (global CSS clamps CSS animation; Motion code must check `useReducedMotion()`).
- **States:** every query renders `<Loading/>` and `<ErrorState/>`; empty lists get a quiet one-line serif italic message.
- **Copy voice:** short, calm, second person, no exclamation marks, no gamification.

## Product flow

- First visit: `/signin` -> `/` Home. `Begin` with no practice profile -> Mode -> Intention -> Object ->
  `PUT /api/me/practice` -> `/sit`.
- With a profile, `Begin` goes straight to `/sit` ("the camera walks in": the Home figure grows into the session figure).
- `/sit` creates the session (`POST /api/sessions`) from the profile, runs the timer locally, records returns
  (tap anywhere = "I wandered and came back"), ends on time or on hold-to-end, then `POST .../complete` and
  `/sit/complete/:id` (note, share to circle).
- `/you` edits the profile; "Change practice" re-enters the Mode -> Intention -> Object flow pre-filled.
- Circle: Discussion (threads) / Hours (month leaderboard, sitting-now). Threads can attach one of your sittings;
  others open it, read conditions and history, and reply.

## Running

```
docker compose up -d                                  # Postgres
cd backend && .venv/bin/uvicorn app.main:app --reload  # :8000
cd frontend && npm run dev                            # :5180 (proxies /api -> :8000)
npm run typecheck && npm run lint && npm test         # static + unit
npm run e2e                                           # isolated stack on :8001/:5181
```
