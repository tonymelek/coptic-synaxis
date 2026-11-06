# Coptic Synaxis

Liturgical companion for the Coptic Orthodox year: feast and season timeline, the day’s katamaros reading references, and bilingual Bible text.

**npm package name:** `coptic-synaxis` (private app)

Built with **Vue 3**, **Vite**, **Vue Router**, and **Tailwind CSS**. Calendar and scripture logic come from open npm packages so other apps can reuse the same behavior.

## Packages

| Package | Role |
|---------|------|
| [`coptic-readings`](https://www.npmjs.com/package/coptic-readings) | Date → feast, tune, Coptic calendar fields, and katamaros refs |
| [`bible-citation-text`](https://www.npmjs.com/package/bible-citation-text) | Citation string → English / Arabic verse text |

Psalm notes: use `psalm` to fetch text; `psalm_coptic_ref` is display-only (Coptic numbering).

## Site layout

Marketing pages live at the site root. The Vue app is under `/app/`.

| Path | What |
|------|------|
| `/` | Home |
| `/packages.html` | Install snippets |
| `/about.html` | About |
| `/story.html` | History behind |
| `/contact.html` | Bugs & feedback |
| `/support.html` | Donations |
| `/app/` | Today’s readings + year feasts |
| `/app/bible` | Free Bible lookup |
| `/app/view` | Passage viewer (`?day=&reading=` or `?ref=`) |
| `/app/playground` | Live package playground |

## Develop

```bash
yarn
yarn dev
```

- Marketing: [http://localhost:5173/](http://localhost:5173/)
- App: [http://localhost:5173/app/](http://localhost:5173/app/)

```bash
yarn build
yarn preview
```

Production build outputs marketing HTML into `dist/` and the SPA as `dist/app.html` with assets under `base: '/app/'`.

## Stack notes

- Entry: `app.html` (SPA), static pages in `public/`
- Routing plugin in `vite.config.js` serves marketing at `/` and the app under `/app/`
- Shared branding with [coptic-tools](https://github.com/tonymelek/coptic-tools) (logo + favicons)
