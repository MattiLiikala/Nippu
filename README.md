# Nippu

A household shopping list and recipe app built as a mobile-first PWA. Multiple people in the same household share lists and recipes in real time.

## Features

**Lists**
- Create multiple shopping lists per household
- Add items manually or from saved sets
- Drag to reorder items and sections
- Categorize items into sections (drag-and-drop between sections)
- Undo item removal

**Sets**
- Save reusable item sets (e.g. "Weekly groceries") per list
- Items in sets can have sections/categories that carry over when added to a list
- Drag to reorder items and sections within a set

**Recipes**
- Store recipes with ingredients, steps, tags, time, and servings
- Pick ingredients from a recipe and add them to any list

**Household**
- Shared account for multiple people — one household, one password
- All lists, sets, and recipes are shared within the household

**Other**
- Dark mode
- PWA — installable on iOS and Android
- Smooth tab transitions with persistent bottom navigation

## Tech stack

- **Frontend**: React 18, Vite, Zustand, React Router v6, @dnd-kit
- **Backend**: Express 5, SQLite (better-sqlite3), JWT auth
- **PWA**: vite-plugin-pwa

## Development

```bash
npm install
npm run dev
```

This starts both the Vite dev server (port 5173) and the Express API (port 3001) concurrently.

Create a `.env` file in the project root:

```
JWT_SECRET=your-secret-here
DATABASE_URL=postgresql://localhost/nippu
PORT=3001
```

`DATABASE_URL` can point to a local Postgres instance or directly to the Netlify/Neon connection string.

## Deployment (Netlify)

The frontend is served as static files from `dist/`. The backend runs as a Netlify Function (`netlify/functions/api.js`) that wraps the Express app with `serverless-http`. All `/api/*` requests are redirected to the function via `netlify.toml`.

The database is Netlify's built-in Postgres (Neon-backed). Enable it in the Netlify dashboard under **Integrations → Postgres** — the `DATABASE_URL` environment variable is then injected automatically. Add one more variable manually:

```
JWT_SECRET=your-secret-here
```

The build command (`npm run build && node scripts/init-db.js`) creates all tables and runs any column migrations automatically on every deploy, so no manual schema setup is needed.
