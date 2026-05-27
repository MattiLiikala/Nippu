# Nippu — Product

## What it is

A shared household list app. One household = one shared account. Members collaborate on any kind of list — shopping, todos, errands, or anything else. Save reusable item sets and pull ingredients from recipes.

## Core concepts

**Household** — the shared unit. All lists, sets, and recipes belong to the household. Authentication is household-based (name + password), not per-user.

**Lists** — the primary object. A shopping list with items. Items can be grouped into named sections (categories). Items are checked off (removed) as you shop. Supports drag & drop reordering.

**Sets** — saved item collections attached to a list. Think "my regular weekly shop" or "BBQ essentials." Sets live inside a list and can be browsed in a drawer. Items from a set can be added to the active list one-click. Sets have a name, an optional description, and items that can be categorized and reordered.

**Recipes** — standalone recipe cards with ingredients, tags, cook time, and serves count. Ingredients can be selected and sent to any shopping list.

## Screens

| Route | Screen |
|---|---|
| `/lists` | Home — list of all household lists |
| `/lists/:id` | List screen — items, sections, sets drawer |
| `/recipes` | Recipe list + search |
| `/recipes/:id` | Recipe detail — ingredients tab + recipe steps tab |
| `/household` | Settings — household name, password, dark mode, sign out |

## Navigation

Bottom nav with three tabs: Lists, Recipes, Household. No nested navigation beyond one level deep (list detail is the deepest).

## Key UX patterns

- **Inline editing** — titles and descriptions are edited in-place by tapping, no modal needed
- **Optimistic updates** — UI updates immediately, API call follows
- **Undo on remove** — checking off a list item shows an undo toast for a few seconds
- **Drawers** — secondary actions (creating a list, sets browser) appear as bottom sheet drawers, not new screens
- **Confirm dialogs** — destructive actions (delete list, delete set) always ask for confirmation in a modal

## Tech stack

- **Frontend**: React + Vite, Zustand (global store), React Router
- **Drag & drop**: @dnd-kit/core + @dnd-kit/sortable
- **Backend**: Express (Node), SQLite via @libsql/client
- **Hosting**: Netlify (functions + static)
- **Auth**: Household-scoped, JWT stored in localStorage
