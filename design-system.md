# Nippu — Design System

## Typography

| Role | Font | Notes |
|---|---|---|
| Body / UI | **Overlock** | Default for all text, buttons, inputs |
| Labels / secondary | **Figtree** | Used in drawers, section headers, set tabs |
| Brand / logo | **Leckerli One** | Logo mark only |

| Font | Medium | Bold |
|---|---|---|
| **Overlock** | 400 | 900 |
| **Figtree** | 500 | 700 |

### Type scale

Five sizes on the 4px grid:

| Size | Weight | Role | Example usage |
|---|---|---|---|
| **28px** | 900 | Screen title | Main screen headings (Recipes, Household) |
| **24px** | 900 | Screen title (variable) | Home screen title when showing household name |
| **20px** | 900 | Section title / drawer title | List detail header, drawer title, card headings, confirm dialog heading |
| **16px** | 400 or 900 | Body / UI | List items (400), tabs/labels/button text (900) |
| **12px** | 400 or 900 | Metadata / caption | Subtitle/description text (400), section header labels/step badge/chips (900) |

**Rules of thumb:**
- Screen titles (`h1`): 24–28px, weight 900, `letter-spacing: -0.5px`
- Secondary headings and drawer/modal titles (`h2`): 20px, weight 900, `letter-spacing: -0.3px`
- List items and primary tappable content: 16px, weight 400
- Supporting text directly below a title, captions: 12px, weight 400, `var(--text2)`
- Section header labels: 12px, weight 900, uppercase, `letter-spacing: 0.08em`, `var(--text2)`
- Everything in drawers defaults to **Figtree**; everything else defaults to **Overlock**

## Color tokens

All colors are CSS custom properties. Dark mode is toggled via `[data-dark="true"]` on `<html>`.

| Token | Light | Dark | Purpose |
|---|---|---|---|
| `--bg` | `#FAF9F6` | `#1A1814` | Page background |
| `--surface` | `#FFFFFF` | `#221F1A` | Cards, drawers, dropdowns |
| `--surface2` | `#F0EDE6` | `#2A2720` | Secondary surface, inactive tabs |
| `--border` | `#E8E4DC` | `#3A3730` | Borders, dividers, placeholder icons |
| `--text` | `#1C1A16` | `#F0EDE6` | Primary text |
| `--text2` | `#56554c` | `#a6a097` | Secondary / muted text |
| `--accent` | `#55868C` | `#245b61` | Primary action, active states |
| `--accent-lt` | `#E8E3D4` | `#2A2720` | Accent chip backgrounds |
| `--accent-dk` | `#2e5c61` | `#A8CDD0` | Active nav labels |
| `--danger` | `#C0392B` | `#E05C4B` | Destructive actions |
| `--danger-lt` | `#FBEAE8` | `#2E1A18` | Danger button light backgrounds |

## Border radii

| Token | Value | Used for |
|---|---|---|
| `--radius-xl` | `28px` | Cards, modals |
| `--radius-lg` | `20px` | Inputs |
| `--radius-md` | `14px` | Dropdowns, tooltips, small cards |
| `--radius-sm` | `10px` | Autocomplete items |
| pill | `999px` | Buttons, tabs, chips, toasts |

## Shadows

| Token | Value | Used for |
|---|---|---|
| `--shadow` | `0 2px 12px rgba(28,26,22,0.08), 0 1px 3px rgba(28,26,22,0.06)` | Cards |
| `--shadow-lg` | `0 8px 32px rgba(28,26,22,0.12), 0 2px 8px rgba(28,26,22,0.08)` | Drawers, modals, drag overlays |

## Easing

| Token | Value | Used for |
|---|---|---|
| `--spring` | `cubic-bezier(0.34, 1.56, 0.64, 1)` | Tap feedback, bouncy interactions |
| `--ease` | `cubic-bezier(0.4, 0, 0.2, 1)` | Screen transitions, subtle fades |

## Spacing

The spacing system follows a strict **4px grid**. Every value is a multiple of 4.

### Gap (flex row/column spacing)

| Value | Use |
|---|---|
| `4px` | Nav icon → label (tight vertical stack) |
| `8px` | Compact rows — icon + text pairs, tag rows, search icon + input |
| `12px` | Standard row items — icon + text in list rows, stacked button groups |
| `14px` | Spacious rows — list item rows (check circle + text + grip) |

### Padding — screens and containers (3 sizes)

Only `8px`, `16px`, and `24px` are used for screen and container padding.

| Size | Value | Use |
|---|---|---|
| **Small** | `8px` | Tight breathing room — tab rows, compact section gaps |
| **Medium** | `16px` | Standard — screen headers (vertical), card internal (vertical), input fields |
| **Large** | `24px` | Default horizontal padding for all screens, drawers, and modals |

Common patterns:
- Screen content horizontal: `0 24px`
- Screen header: `16px 24px 8px` (top 16, sides 24, bottom 8)
- Cards (`.card`): `16px 24px`
- Modals / confirm dialogs: `24px 24px`
- Input fields (`.input-field`): `16px 16px`
- Login screen: `24px 24px 24px`

### Padding — interactive elements (3 sizes)

| Size | Padding | Use |
|---|---|---|
| **Large** | `16px` | Full-width buttons — primary, ghost, confirm/danger |
| **Medium** | `12px 24px` | Inline pill buttons — non-full-width actions (e.g. save, edit) |
| **Small** | `8px 16px` | Compact pills — set tabs, "+ Set", "+ Section", undo |

Other interactive element padding:
- `4px 12px` — chips and tags (`.chip`)
- `4px 8px` — small tag chips (font-size 11 variant)
- `12px 16px` — dropdown menu items
- `4px` — icon-only buttons

### Vertical rhythm — between sections

| Value | Use |
|---|---|
| `4px` | Micro-gap, tight metadata spacing (e.g. subtitle below title) |
| `8px` | Small gap between related elements (title → input) |
| `12px` | Standard gap between components |
| `16px` | Clear separation between form fields or sections |
| `24px` | Generous separation (e.g. above confirm buttons) |
| `40px 0` | Empty state vertical padding (compact) |
| `60px 0` | Empty state vertical padding (full screens) |

### Section header margin

- `margin: 20px 0 8px` — standard section header (20px above, 8px below)
- `margin: 8px 0 4px` — tighter variant used inside drawers

## Layout

- Max width: **600px**, centered. The app is mobile-first.
- Bottom nav height: `--nav-h: 72px`
- Screen padding: `20–24px` horizontal
- `.screen`: `display: flex; flex-direction: column; height: 100%; overflow: hidden`
- `.scroll-area`: the scrollable content region, hides scrollbars, `padding: 0 20px`

## Animations

| Name | From → To | Used for |
|---|---|---|
| `screenIn` | `translateX(40px), opacity:0 → normal` | Route transitions |
| `itemIn` | `translateY(8px), opacity:0 → normal` | List items appearing |
| `itemOut` | `normal → translateX(20px), opacity:0` | List items being removed |
| `slideUp` | `translateY(100%) → normal` | Drawers |
| `fadeIn` | `opacity:0 → normal` | Overlays |
| `toastIn` | `translateY(8px), scale(0.95) → normal` | Modals, undo toast |
| `fabMenuIn` | `translateY(12px), scale(0.9) → normal` | FAB menu |

## Component patterns

### Buttons

- **`.btn-primary`** — full-width, pill, accent background, white text. For the main CTA.
- **`.btn-ghost`** — full-width, pill, transparent with border. For secondary/cancel.
- **FAB** (`.fab`) — 56px circle, accent, bottom-right. Rotates 45° when open.
- **Back button** (`.back-btn`) — 38px circle, surface background, no border.
- **Icon-only buttons** — `background: none; border: none; padding: 4px; border-radius: 8px`.

### Cards

- **`.card`** — white surface, `--radius-xl`, `--shadow`, `18px 20px` padding.
- **`.list-card`** — extends `.card` with `cursor: pointer`, scales to `0.98` on active.

### Inputs

- **`.input-field`** — full-width, `--radius-lg`, 1.5px border, focuses with accent border.
- **`.add-row`** — dashed 2px border input area, focuses with accent border, used for adding items inline.
- **Inline editable text** — tapping a title or description activates an unstyled input with only a bottom border (`1.5px solid var(--text2)` or `var(--accent)`).

### Section headers

- **`.section-header`** — `font-size: 13px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; color: var(--text2)`. Margin `20px 0 10px`.
- Editable via `EditableSectionHeader` component — click to rename inline.

### Chips / Tags

- **`.chip`** — pill, `--accent-lt` background, `--accent-dk` text, `12px` font.

### Drawers

- **`.overlay`** — fixed full-screen, `rgba(0,0,0,0.35)`, `z-index: 30`.
- **`.drawer`** — fixed bottom, `28px 28px 0 0` radius, slides up with `--spring`. Handle bar (`.drawer-handle`) at top.

### Dropdown menus (three-dots)

Opened by an `IconMore` button. Pattern:
1. A backdrop `div` at `z-index: 19` dismisses on click.
2. A `position: absolute` panel at `z-index: 20` with `--surface`, `--radius-md`, `--shadow-lg`, `1px solid var(--border)`.
3. Menu items: `12px 16px` padding, `14px` font, `600` weight. Danger items use `var(--danger)`.

### Confirmation modals

Used for destructive actions (remove list, remove set). Pattern:
- Overlay at `z-index: 40`.
- Centered panel at `z-index: 41`: `--radius-xl`, `28px 24px` padding, max-width `360px`, `toastIn` animation.
- Title (`18px 800`), body copy (`14px var(--text2)`), then stacked buttons: primary danger action + `.btn-ghost` cancel.

### Undo toast

`.undo-toast` — full-width pill, `var(--text)` background, `var(--bg)` text. Contains label + `.undo-btn` (white pill with accent text).
