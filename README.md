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

This starts both the Vite dev server (port 5173) and the Express API (port 3001) concurrently. The API uses a local SQLite file (`nippu.db`) when `TURSO_DATABASE_URL` is not set.

Create a `.env` file in the project root:

```
JWT_SECRET=your-secret-here
PORT=3001
```

## Deployment (Netlify)

The frontend is served as static files from `dist/`. The backend runs as a Netlify Function (`netlify/functions/api.js`) that wraps the Express app with `serverless-http`. All `/api/*` requests are redirected to the function via `netlify.toml`.

The database uses [Turso](https://turso.tech) (a serverless SQLite-compatible cloud database). Set these environment variables in the Netlify dashboard:

```
JWT_SECRET=your-secret-here
TURSO_DATABASE_URL=libsql://your-db.turso.io
TURSO_AUTH_TOKEN=your-token-here
```

To create a Turso database:
```bash
turso db create nippu
turso db show nippu        # get the URL
turso db tokens create nippu  # get the auth token
```
