# Dinosaur Evolution Runner

A minimalist 2D endless-running arcade game built for Reddit on **Devvit Web**, powered by **Phaser 4.2.1**, **TypeScript 6.0.3**, **Vite 8.3.7**, **Hono 4.13.17**, and **Devvit Redis**.

- [Devvit](https://developers.reddit.com/): Build and deploy interactive games on Reddit
- [Phaser](https://phaser.io/): 2D game engine (`4.2.1`)
- [Vite](https://vite.dev/): Client and server bundling (`8.3.7`)
- [Hono](https://hono.dev/): Serverless backend REST API (`4.13.17`)
- [TypeScript](https://www.typescriptlang.org/): Strict type safety (`6.0.3`)

## Documentation

Project specifications and lifecycle tracking live in `/docs`:

- [`docs/PROJECT_MASTER_PLAN.md`](./docs/PROJECT_MASTER_PLAN.md) — Authoritative lifecycle plan, requirements, phases, guidelines, and success criteria
- [`docs/GAME_DESIGN_DOCUMENT.md`](./docs/GAME_DESIGN_DOCUMENT.md) — Core loop, dinosaur species, transformation mechanics, environments, and UI/audio design
- [`docs/ARCHITECTURE.md`](./docs/ARCHITECTURE.md) — Client/server boundaries, logical world coordinates, Hono REST API, and Redis schema
- [`docs/ROADMAP.md`](./docs/ROADMAP.md) — Phase-by-phase implementation checklist

## Getting Started

> Make sure you have **Node.js `>=24.0.0`** installed on your machine before running.

1. Install dependencies: `npm install`
2. Log in to Reddit CLI (if needed): `npm run login`
3. Start live Reddit playtest: `npm run dev`

## Commands

- `npm run dev`: Launch Devvit playtest (`devvit playtest`)
- `npm run build`: Build client and server bundles (`vite build`)
- `npm run test:types`: Check TypeScript types (`tsc --build`)
- `npm run test:unit`: Run unit tests (`node --experimental-strip-types ... --test "src/**/*.test.ts"`)
- `npm run lint`: Run ESLint (`eslint 'src/**/*.{ts,tsx}'`)
- `npm run prettier`: Format files (`prettier --write .`)
- `npm run login`: Log CLI into Reddit (`devvit login`)
- `npm run deploy`: Run `test:types`, `lint`, and upload to Devvit (`devvit upload`)
- `npm run launch`: Deploy and publish for review (`devvit publish`)

## Credits

Initial project scaffolded from the [Devvit Phaser template](https://github.com/phaserjs/template-vite-ts).
