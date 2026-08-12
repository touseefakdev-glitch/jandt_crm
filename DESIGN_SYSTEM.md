# J&T Supplies CRM — Design System

> Premium, enterprise-grade operations UI built on a **Soft 3D / Depth-first** visual language.
> Primary target: **1920 × 1080 desktop** with fluid full-width layout (no page-level horizontal scrolling).

---

## 1. Design Philosophy

The interface communicates **reliability, precision, speed, and operational control**. It uses a
layered surface hierarchy ("Soft 3D") rather than flat design or cartoon 3D:

```
Background  →  Surface  →  Card  →  Elevated Card  →  Overlay (Modal / Drawer)
    ↓            ↓          ↓           ↓                  ↓
  furthest   subtle      crisp      deeper           floats above all
```

Each layer feels slightly closer to the user via a subtle combination of shadows, hairline
borders, gradient highlights, and inset top highlights. Depth is achieved **with CSS only**
(shadows, gradients, borders, transforms) — no WebGL, no heavy animation libraries.

---

## 2. Color System

A **deep navy / charcoal foundation** with cool neutral surfaces and **one distinctive teal accent**.

### Structural
| Token            | Hex       | Usage                                   |
| ---------------- | --------- | --------------------------------------- |
| Navy 900         | `#102A43` | Primary structural color, dark panels   |
| Navy 950         | `#091A2B` | Deepest surfaces, backdrop tints        |
| Teal 500         | `#00A6A6` | **Primary action accent**, focus rings  |

### Surfaces
| Token       | Hex       | Usage                          |
| ----------- | --------- | ------------------------------ |
| Background  | `#F4F7FB` | App background (+ radial tints)|
| Surface     | `#FFFFFF` | Cards, panels                  |
| Muted       | `#E9EFF5` | Sub-containers, tab rails      |
| Muted 2     | `#F1F5FA` | Table hover / soft fills       |
| Border      | `#DCE4EF` | Hairline structural borders    |
| Border strong| `#C4D0E0` | Hover borders                  |

### Text
| Token    | Hex       | Usage                    |
| -------- | --------- | ------------------------ |
| Primary  | `#132A4A` | Headings, primary body   |
| Secondary| `#52606D` | Body copy, labels        |
| Muted    | `#7B8CA4` | Captions, placeholders   |

### Status / Semantic
| Token            | Hex       | Usage                                          |
| ---------------- | --------- | ---------------------------------------------- |
| Success green    | `#1E8A57` | Completed steps, available, positive           |
| Warning amber    | `#D99C2E` | Pending, attention, order differences          |
| Error red        | `#D64545` | Errors, destructive actions                    |
| Info / sky       | `#0E7490` | Informational, Received step                   |
| Indigo / violet  | (defaults)| Secondary workflow stage accents               |

> **Rule:** color is reserved for **status, actions, alerts, and important information**.
> Surfaces stay neutral so data remains calm and legible. Status badges use soft tinted
> pills (`bg-*-50 text-*-700 ring-*-200`) with solid variants reserved for emphasis.

---

## 3. Typography

- **Font family:** Inter (weights 300–800) with system fallbacks.
- **Font feature settings:** `cv02 cv03 cv04 cv11`; numerals use `tabular-nums` in data cells.

### Hierarchy
| Element        | Size    | Weight   | Tracking | Notes                       |
| -------------- | ------- | -------- | -------- | --------------------------- |
| Page Title     | 20–24px | 800      | tight    | `crm-page-title`            |
| Section Title  | 14px    | 700      | tight    | `crm-section-title`         |
| Card Title     | 14px    | 700      | tight    | `crm-card-title`            |
| Table Header   | 11px    | 700      | wider    | uppercase, `text-2xs`       |
| Body           | 14px    | 400–600  | normal   | default table/body size     |
| Secondary      | 12px    | 400–500  | normal   | `crm-muted`                 |
| Caption        | 11px    | 400–700  | normal   | meta, timestamps, mono ids  |

---

## 4. Spacing System

Base scale in `4px` increments. Use these values — avoid ad-hoc margins.

| Token     | Px   |
| --------- | ---- |
| `--space-1` | 4  |
| `--space-2` | 8  |
| `--space-3` | 12 |
| `--space-4` | 16 |
| `--space-5` | 20 |
| `--space-6` | 24 |
| `--space-8` | 32 |
| `--space-10`| 40 |

Page stack: `space-y-5` (mobile) / `space-y-6` (desktop). Card padding: `16–20px`.
Table cells: `px-4 py-3`. Compact toolbar gap: `12px`.

---

## 5. Border Radius

| Token       | Px     | Usage                        |
| ----------- | ------ | ---------------------------- |
| `--radius-sm` | 8px  | Buttons, inputs, small chips |
| `--radius-md` | 12px | Cards, toolbars, badges base |
| `--radius-lg` | 16px | Modals / large panels        |
| pill        | 9999px | Badges, status pills, avatars |

> Avoid over-rounding everything; radius communicates hierarchy.

---

## 6. Shadows (3D Depth Stack)

Defined as CSS vars and Tailwind `boxShadow` tokens:

| Layer   | Name     | Usage                                |
| ------- | -------- | ------------------------------------ |
| L1      | `card`   | Standard cards, toolbars             |
| L2      | `elevated` | Emphasized cards                  |
| L3      | `popover`  | Dropdowns, popovers               |
| L4      | `overlay`  | Modals, drawers                   |
| Hover   | `lift`   | Interactive card/button hover lift   |
| Accent  | `glow-teal` | Primary actions, active states   |
| Inset   | `inset-top` | White inner top highlight on cards |

Cards combine `shadow-card` **+** `inset-top` for a crisp "machined" top edge.
Hover interactions use `-translate-y-0.5` + `shadow-lift` (150–180ms).

---

## 7. Buttons

Reusable `Button` with variants: `primary` (teal gradient), `secondary` (navy), `outline`,
`ghost`, `danger`, `success`. Sizes: `sm` (32px), `md` (36px), `lg` (40px).
Supports `icon`, `iconRight`, `loading`, `iconOnly`, `fullWidth`.

- Consistent height + radius (8px).
- Micro-interaction: `hover:-translate-y-px` + active press.
- Primary uses `bg-gradient-teal-primary` for a premium soft-3D accent.
- Icon-only secondary actions should expose a `title`/`aria-label`.

---

## 8. Cards

`Card` with `flush` (edge-to-edge tables), `elevated`, `hoverable` variants.
`CardHeader` (title/subtitle/actions/icon) uses a subtle top gradient (`from-[#FBFCFE] to-white`).

---

## 9. Tables

`Table` primitive (`Table`, `THead`, `TBody`, `Tr`, `Th`, `Td`):

- **`table-layout` friendly** — every column declares `width` (px) via `Th width` / `Td width`.
- **No text collisions** — long content uses `truncate` + native `title` tooltip (`maxWidth` optional).
- The wrapper (`crm-table-scroll`) scrolls **internally** only; the page never scrolls horizontally.
- Optional `stickyHeader` (`.sticky-table-head`), `minWidth`, `wrapperClassName`.
- Header: `#F4F7FB` uppercase 11px; rows `border-b #E9EFF5`, hover `#F4F7FB`.

### 1920px column budget (main content ≈ 1616px with sidebar expanded)
| Orders table (example) | Width |
| ---------------------- | ----- |
| Customer               | 220   |
| City                   | 90    |
| Route                  | 90    |
| Status                 | 120   |
| Received               | 90    |
| Sales Order            | 120   |
| Invoiced               | 120   |
| Order Match            | 110   |
| Dispatched             | 90    |
| POD Sent               | 90    |
| Exception              | 120   |
| Last Updated           | 120   |
| **Total**              | **1380** (fits) |

> If a table would exceed the workspace, prefer: compact columns → short status labels →
> icons+tooltips → expandable rows → detail drawer. Never make the page scroll horizontally.

---

## 10. Forms

- Two-column grid layouts on desktop (`grid-cols-1 sm:grid-cols-2`), stacking at smaller widths.
- Inputs/Selects use `crm-input`: 8px radius, `#DCE4EF` border, teal focus ring (`ring-teal-500/20`).
- Labels: 11px bold uppercase tracking-wider secondary text.
- Compact filter toolbars: search box + 4–6 dropdown selects in one row on `xl`.

---

## 11. Modals & Drawers

- **Modal**: backdrop `slate-950/45` + `blur-[3px]`, panel `rounded-panel` (16px), `animate-scale-in`, sizes `sm`–`xl`, Esc/backdrop close, focus trap, header gradient, footer rail `#F4F7FB`.
- **Drawer**: right-side for Order/Customer/Query details, width 400–640px (`sm`–`lg`), backdrop blur, `animate-drawer-in-right`. Bottom drawer for mobile with `max-h-[85vh]`.
- Never full-screen modals for small forms; size to content.

---

## 12. Status Badges

Tinted pill badges (`Badge` component) fed by `utils/badges.ts`:

| Priority/Status | Subtle style                            |
| --------------- | --------------------------------------- |
| Urgent / Error  | `bg-red-50 text-red-700 ring-red-200`   |
| High / Warning  | `bg-amber-50 text-amber-700 ring-amber-200` |
| Normal / Info   | `bg-sky-50 text-sky-700 ring-sky-200`   |
| Success         | `bg-emerald-50 text-emerald-700 ring-emerald-200` |
| Muted           | `bg-slate-100 text-slate-600 ring-slate-200` |

Optional `dot` indicator; `solid` variant for emphasis.

---

## 13. Workflow Stepper

`WorkflowStepper` renders a horizontal progress rail for the 5-stage order pipeline:

```
● Received ─── ● SO ─── ● Invoice ─── ○ Dispatch ─── ○ POD
```

- **done** = filled with step color + check
- **current** = glowing teal ring
- **pending** = muted outline
- **error** = red
Connector bars fill when the preceding stage is complete. Use in the Order Detail drawer.

---

## 14. Layout System

```
┌────────────────────────────────────────────────────────────┐
│ HEADER (glass, sticky, 56px)                                │
├──────────────┬─────────────────────────────────────────────┤
│              │                                              │
│ SIDEBAR      │ MAIN CONTENT (fluid, grows to fill)          │
│ 240px / 72px │                                              │
│              │                                              │
└──────────────┴─────────────────────────────────────────────┘
```

- **Container:** `.content-width` = `100%` with `px-4/6/8`, `max-width: 1920px`.
  No narrow centered cap — the workspace is used fully.
- **Sidebar:** expanded `240px`, collapsed `72px`, dark navy gradient; active item shows a teal left bar + tinted gradient.
- **Header:** `56px`, glass (`backdrop-blur`) with border + soft shadow; holds page context, sync state, notifications, profile.
- **KPI grid:** 4 cards per row at `xl` (1920px target), 2 at `sm`, 1 at mobile.

### Breakpoints
| Breakpoint | Behavior                                             |
| ---------- | ---------------------------------------------------- |
| `≥1280px`  | Sidebar + full-width fluid content, 4 KPI columns    |
| `1024–1279`| Reduced container padding, 3–4 KPI columns, denser tables |
| `768–1023` | Sidebar collapses to rail (collapsible), tables scroll internally |
| `<768px`   | Mobile drawer nav, stacked cards/forms, tables scroll internally |

---

## 15. Animation Rules

- **Duration:** 150–250ms for micro-interactions; 220ms for drawer/modal open.
- **Easing:** `cubic-bezier(0.16, 1, 0.3, 1)` for drawers; `ease-out` elsewhere.
- Allowed: button/card hover lift, focus rings, fade/scale-in, drawer/stepper transitions,
  toast slide-in, skeleton shimmer. **No** bouncing, wobbling, or continuous ambient animation.
- Respect `prefers-reduced-motion` where practical; never animate layout-critical widths beyond a 500ms cap on progress bars.

---

## 16. Loading States

Skeleton loaders (`Skeleton`, `SkeletonTable`, `SkeletonCard`, `SkeletonKpiGrid`,
`SkeletonList`, `PageSkeleton`) use a soft `shimmer` sweep — never blank flash.
`DataTable` shows `SkeletonTable` while `loading`.

---

## 17. Toast Notifications

Fixed top-right, max width 24rem. Cards: white, ring colored per type, 4px gradient left bar,
icon tile (emerald/red/teal). Auto-dismiss 4.5s, manual dismiss button. Non-intrusive.

---

## 18. Accessibility

- WCAG-friendly contrast on all text/status combos.
- Visible `:focus-visible` teal ring app-wide.
- All buttons have `aria-label`/`title` when icon-only; tables keep real `th` semantics.
- Tooltips are keyboard-reachable (`group-focus-visible`).
- Modals/drawers trap focus and restore focus on close; Esc closes.

---

## 19. Icon System

Single icon library: **Lucide React** (`lucide-react`). Never mix icon styles.
Icons are 16–20px, stroke-based, `shrink-0` in flex rows.
