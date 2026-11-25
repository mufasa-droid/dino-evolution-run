You are writing a Devvit web application that will be executed on Reddit.com.

## Authoritative Documentation

Before planning or implementing changes, consult the project documentation in `/docs`:

- `docs/PROJECT_MASTER_PLAN.md`: Authoritative development lifecycle, phases, requirements, testing standards, and success criteria.
- `docs/GAME_DESIGN_DOCUMENT.md`: Core gameplay loop, controls, dinosaur species, transformation mechanics, abilities, obstacles, environments, scoring, and UI flow.
- `docs/ARCHITECTURE.md`: Client/server boundaries, logical world coordinates, pure simulation vs. Phaser rendering, Hono REST API, and Redis schema.
- `docs/ROADMAP.md`: Phase-by-phase task tracking (never mark unimplemented features as completed).

All code changes must align with these documents and the rules below.

## Tech Stack

- **Frontend**: Phaser (`4.2.1`), Vite (`8.3.7`), TypeScript (`6.0.3`)
- **Backend**: Node.js (`>=24.0.0`) serverless environment (Devvit Web `0.15.6`), Hono (`4.13.17`)
- **Communication**: Hono REST endpoints (`/api/*`) with shared TypeScript types in `src/shared/` and runtime validation on client/server

## Layout & Architecture

- `/src/server`: **Backend Code**. Runs in a secure, serverless environment.
  - `index.ts`: Main server entry point (Hono app mounting `/api` and `/internal`).
  - `routes/`: Hono route modules (`api.ts`, `forms.ts`, `menu.ts`, `triggers.ts`).
  - `core/`: Server domain helpers (e.g., `post.ts`).
  - Access `redis`, `reddit`, and `context` here via `@devvit/web/server`.
- `/src/client`: **Frontend Code**. Executed inside an iFrame on reddit.com.
  - To add an entrypoint, create an HTML file and add the mapping inside `devvit.json`.
  - Entrypoints:
    - `game.html` (`game.ts`): Main Phaser `4.2.1` game entry point (Expanded View).
    - `splash.html` (`splash.ts`): Initial lightweight vanilla TypeScript entry point (Inline View) shown in the reddit.com feed. Keep it fast and keep Phaser and heavy dependencies inside `game.html`.
- `/src/shared`: **Shared Code**. TypeScript types and constants shared between client and server.

## Frontend Rules & Limitations

### Rules

- Instead of `window.location` or `window.assign`, use `navigateTo` from `@devvit/web/client`.
- Verify all Phaser APIs against **Phaser 4.2.1** (do not assume Phaser 3 signatures without checking).
- Always remove `this.scale.on('resize', ...)` and global event listeners on scene `SHUTDOWN` to prevent leaks across scene restarts.
- Keep core runner simulation logic pure and decoupled from Phaser `Scene` / `GameObject` classes so it is unit-testable.

### Limitations

- `window.alert`: Use `showToast` or `showForm` from `@devvit/web/client`.
- File downloads: Use clipboard API with `showToast` to confirm.
- Geolocation, camera, microphone, and notifications web APIs: No alternatives.
- Inline script tags inside of `html` files: Use a `<script type="module" src="...">` tag and separate `.ts` file.

## Commands

- `npm run test:types`: Check TypeScript types (`tsc --build`)
- `npm run lint`: Run ESLint (`eslint 'src/**/*.{ts,tsx}'`)
- `npm run test:unit`: Run unit tests (`node --experimental-strip-types --no-warnings=ExperimentalWarning --test "src/**/*.test.ts"`)
- `npm run build`: Build client and server bundles (`vite build`)
- `npm run dev`: Launch Devvit playtest (`devvit playtest`)
- `npm run prettier`: Format files (`prettier --write .`)

## Code Style

- Prefer type aliases (`type`) over interfaces (`interface`) when writing TypeScript.
- Prefer named exports over default exports.
- Never cast TypeScript types (`as` or `<Type>` assertions); use type guards or runtime validation.

## Global Rules

- You may find external references to blocks or `@devvit/public-api`. Do NOT use them; this project is configured for **Devvit Web only**.
- Whenever you add an endpoint for a new menu item, form, or trigger action, ensure the corresponding mapping is registered in `devvit.json`.
- Do not modify gameplay code, server code, package dependencies, or `devvit.json` when performing documentation-only tasks.

Docs: https://developers.reddit.com/docs/llms.txt.
