# Design System — Plataforma NPS · MASTER

> **Source of truth for all UI decisions.**
> Generated with UI UX Pro Max v2.5.0 · Style: Data-Dense Dashboard + Soft UI Evolution hybrid
> When building a page: read this file. If a page-specific override exists at `design-system/pages/<page>.md`, those rules take precedence.

---

## 0. Design Direction

### Context
Internal enterprise platform for NPS survey management and analytics. Users are technical operators and administrators in an agricultural/industrial environment (Crucianelli). Sessions are task-driven: create campaigns, review responses, analyze NPS scores, manage follow-up calls.

### Strategy: "Precision Industrial"
The platform avoids the generic blue-on-white corporate dashboard look by combining:

- **Dark sidebar** — premium feel, strong visual anchor, reduces eye strain in long sessions
- **Warm off-white surfaces** — avoids cold clinical whiteness, feels grounded
- **Indigo-shifted primary** — richer than generic `#2563EB`, feels premium and intentional
- **Amber accent** — references agricultural warmth, distinct from the primary
- **Geometric sans-serif** — Plus Jakarta Sans: modern authority without stiffness
- **Monospace numerics** — JetBrains Mono for all KPI values and scores, adds technical precision

### Style Profile
| Dimension | Choice | Rationale |
|-----------|--------|-----------|
| Style | Data-Dense Dashboard + Soft UI Evolution | Density for ops work; subtle depth for hierarchy |
| Palette mood | Precision Industrial | Dark sidebar + warm surfaces + indigo + amber |
| Typography | Plus Jakarta Sans + JetBrains Mono | Enterprise precision with approachability |
| Motion | Functional only | No decorative animation in a work tool |
| Density | Medium-high | Operators need to see much without scrolling |
| Dark mode | Sidebar always dark; full dark mode as opt-in | Reduces visual noise in the main chrome |

---

## 1. Color System

### 1.1 Design Tokens (globals.css)

```css
:root {
  /* ─── Brand ─────────────────────────────── */
  --primary:           221 75% 38%;     /* #1B3FBC  indigo-shifted brand */
  --primary-foreground: 0 0% 100%;

  --secondary:         214 84% 56%;     /* #3B82F6  interactive blue */
  --secondary-foreground: 0 0% 100%;

  --accent:            38 92% 35%;      /* #B45309  amber-800 (WCAG AA) */
  --accent-foreground: 0 0% 100%;

  /* ─── Surfaces ───────────────────────────── */
  --background:        40 20% 98%;      /* #FAFAF8  warm off-white */
  --foreground:        222 47% 11%;     /* #0F172A  slate-950 */

  --card:              0 0% 100%;       /* #FFFFFF  pure white cards */
  --card-foreground:   222 47% 11%;

  --popover:           0 0% 100%;
  --popover-foreground: 222 47% 11%;

  /* ─── Neutral scale ──────────────────────── */
  --muted:             214 32% 91%;     /* #E2E8F4 */
  --muted-foreground:  215 16% 47%;     /* #64748B  slate-500 */

  --border:            214 32% 91%;     /* #E2E8F4 */
  --input:             214 32% 91%;
  --ring:              221 75% 38%;     /* matches --primary */

  /* ─── Semantic ───────────────────────────── */
  --destructive:       0 84% 43%;       /* #DC1F1F */
  --destructive-foreground: 0 0% 100%;

  --success:           142 71% 30%;     /* #15803D  green-700 */
  --success-foreground: 0 0% 100%;

  --warning:           38 92% 35%;      /* #B45309  same as accent */
  --warning-foreground: 0 0% 100%;

  --info:              214 84% 56%;     /* #3B82F6 */
  --info-foreground:   0 0% 100%;

  /* ─── NPS semantic ───────────────────────── */
  --nps-promotor:      142 71% 30%;     /* #15803D  9–10 */
  --nps-promotor-bg:   142 76% 93%;     /* #DCFCE7 */
  --nps-neutro:        38 92% 35%;      /* #B45309  7–8 */
  --nps-neutro-bg:     48 96% 89%;      /* #FEF9C3 */
  --nps-detractor:     0 84% 43%;       /* #DC1F1F  0–6 */
  --nps-detractor-bg:  0 93% 94%;       /* #FEE2E2 */

  /* ─── Sidebar ────────────────────────────── */
  --sidebar:           222 47% 11%;     /* #0F172A  slate-950  */
  --sidebar-foreground: 213 27% 84%;    /* #C8D3E0 */
  --sidebar-primary:   221 75% 38%;     /* brand */
  --sidebar-primary-foreground: 0 0% 100%;
  --sidebar-accent:    217 33% 17%;     /* #1E293B  hover bg  */
  --sidebar-accent-foreground: 0 0% 100%;
  --sidebar-border:    217 33% 17%;
  --sidebar-ring:      221 75% 38%;

  /* ─── Radius ─────────────────────────────── */
  --radius: 0.5rem;   /* 8px — applied consistently */
}

.dark {
  --background:        222 47% 7%;      /* #0A0F1E */
  --foreground:        213 27% 93%;     /* #E8EDF4 */

  --card:              222 47% 10%;     /* #0F172A */
  --card-foreground:   213 27% 93%;

  --popover:           222 47% 10%;
  --popover-foreground: 213 27% 93%;

  --muted:             217 33% 17%;     /* #1E293B */
  --muted-foreground:  215 20% 65%;     /* #94A3B8 */

  --border:            217 33% 17%;
  --input:             217 33% 17%;

  --primary:           221 75% 60%;     /* lighter for dark bg */
  --primary-foreground: 0 0% 100%;

  --accent:            38 92% 50%;
  --accent-foreground: 222 47% 7%;

  --sidebar:           222 47% 5%;
  --sidebar-foreground: 213 27% 84%;
  --sidebar-accent:    217 33% 12%;
}
```

### 1.2 Semantic Color Usage Reference

| Token | When to use | Never use for |
|-------|-------------|---------------|
| `primary` | Main CTAs, active nav, links | Decorative backgrounds |
| `accent` | Secondary CTAs, badges, highlights, charts accent series | Destructive actions |
| `destructive` | Delete, remove, NPS crítico alerts | Warning states |
| `success` | Confirmations, NPS promotor, estado `respondida` | Info messages |
| `warning` | Pending states, `necesidad_de_llamado`, deadlines | Success states |
| `muted` | Disabled states, secondary text, backgrounds | Primary text |
| `nps-promotor/neutro/detractor` | NPS scores exclusively | Generic status |

### 1.3 Chart Color Palette (Recharts)

```typescript
// src/lib/chart-colors.ts
export const CHART_COLORS = {
  // Primary series — in order of use
  series: [
    'hsl(221, 75%, 38%)',   // indigo-primary
    'hsl(38, 92%, 45%)',    // amber
    'hsl(142, 71%, 30%)',   // green
    'hsl(0, 84%, 43%)',     // red
    'hsl(214, 84%, 56%)',   // blue-secondary
    'hsl(270, 60%, 55%)',   // violet (6th series)
  ],
  // NPS distribution
  nps: {
    promotor:  'hsl(142, 71%, 30%)',
    neutro:    'hsl(38,  92%, 45%)',
    detractor: 'hsl(0,   84%, 43%)',
  },
  // Neutral
  grid:   'hsl(214, 32%, 91%)',
  axis:   'hsl(215, 16%, 47%)',
  tooltip:'hsl(222, 47%, 11%)',
} as const
```

---

## 2. Typography System

### 2.1 Font Stack

**Plus Jakarta Sans** — headings, UI labels, body text (modern geometric, enterprise-grade)
**JetBrains Mono** — all numeric KPI values, NPS scores, counts, percentages in data contexts

```typescript
// app/layout.tsx
import { Plus_Jakarta_Sans, JetBrains_Mono } from 'next/font/google'

const jakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-sans',
  display: 'swap',
})

const mono = JetBrains_Mono({
  subsets: ['latin'],
  weight: ['400', '500'],
  variable: '--font-mono',
  display: 'swap',
})

// Apply to <body className={`${jakarta.variable} ${mono.variable}`}>
```

```css
/* tailwind.config.ts */
fontFamily: {
  sans: ['var(--font-sans)', 'system-ui', 'sans-serif'],
  mono: ['var(--font-mono)', 'ui-monospace', 'monospace'],
}
```

### 2.2 Type Scale

| Role | Size | Weight | Line-height | Font | Class |
|------|------|--------|-------------|------|-------|
| **Page title** | 24px | 700 | 1.2 | Jakarta | `text-2xl font-bold` |
| **Section heading** | 18px | 600 | 1.3 | Jakarta | `text-lg font-semibold` |
| **Card title** | 15px | 600 | 1.4 | Jakarta | `text-[15px] font-semibold` |
| **KPI value (large)** | 32px | 500 | 1 | **Mono** | `text-3xl font-medium font-mono` |
| **KPI value (medium)** | 24px | 500 | 1 | **Mono** | `text-2xl font-medium font-mono` |
| **KPI value (small)** | 18px | 500 | 1 | **Mono** | `text-lg font-medium font-mono` |
| **Body** | 14px | 400 | 1.5 | Jakarta | `text-sm` |
| **Table cell** | 14px | 400 | 1.4 | Jakarta | `text-sm` |
| **Table header** | 12px | 600 | 1 | Jakarta | `text-xs font-semibold uppercase tracking-wide` |
| **Label / meta** | 12px | 500 | 1.3 | Jakarta | `text-xs font-medium` |
| **Badge** | 11px | 600 | 1 | Jakarta | `text-[11px] font-semibold` |
| **Data label (chart)** | 11px | 400 | 1 | **Mono** | `text-[11px] font-mono` |

### 2.3 Key Typography Rules

- Minimum body text: **14px** (`text-sm`). Never `text-xs` for reading.
- KPI numbers always in `font-mono` — creates visual distinction from prose and improves scanning.
- Table headers: `uppercase tracking-wide` — makes structure scannable.
- Line-height for prose: `leading-relaxed` (1.625). For single-line data: `leading-none`.
- Maximum line length for form descriptions: `max-w-prose` (65ch).

---

## 3. Spacing Scale

Grid base: **4px** unit. All spacing is a multiple of 4.

```
4px  → gap-1  p-1   — Icon internal padding, badge padding
8px  → gap-2  p-2   — Related element spacing, inline elements
12px → gap-3  p-3   — Compact card padding
16px → gap-4  p-4   — Standard card padding, section gutters
20px → gap-5  p-5   — Comfortable card padding
24px → gap-6  p-6   — Section separation within a page
32px → gap-8  p-8   — Major section separation
40px → gap-10 p-10  — Page-level breathing room (rare)
48px → gap-12        — Between page sections on large screens
```

### Layout Constants

```typescript
// src/lib/constants/layout.ts
export const LAYOUT = {
  sidebarWidth:         240,   // px — expanded
  sidebarWidthCollapsed: 56,   // px — icon-only
  headerHeight:          56,   // px
  pageMaxWidth:        1440,   // px
  contentPadding:        24,   // px — horizontal, large screens
  contentPaddingMobile:  16,   // px — horizontal, mobile
  tableRowHeight:        44,   // px — touch-safe minimum
  cardBorderRadius:       8,   // px = --radius
  chartHeight: {
    compact: 180,
    standard: 260,
    tall: 340,
  },
} as const
```

---

## 4. Card System

### 4.1 Card Anatomy

All cards use `shadcn/ui Card` components. Three visual elevations:

```
Level 0 — Flat      bg-background, border border-border
Level 1 — Surface   bg-card, shadow-sm border border-border (default)
Level 2 — Raised    bg-card, shadow-md (modals, active selections)
```

```css
/* shadow-sm — default card */
box-shadow: 0 1px 3px 0 rgb(15 23 42 / 0.06),
            0 1px 2px -1px rgb(15 23 42 / 0.04);

/* shadow-md — raised / focused card */
box-shadow: 0 4px 6px -1px rgb(15 23 42 / 0.08),
            0 2px 4px -2px rgb(15 23 42 / 0.06);
```

### 4.2 KPI Card

```typescript
// Anatomy:
// ┌─────────────────────────────────────┐
// │ Icon (20px)  Label               △% │  ← CardHeader: flex justify-between
// │                                     │
// │         32px mono number            │  ← CardContent: text-center or left
// │         subtle unit label           │
// │  ─────────────────────────────────  │
// │  Subtext or comparison caption      │  ← CardFooter: text-xs text-muted-fg
// └─────────────────────────────────────┘

interface KPICardProps {
  label: string
  value: number | string
  unit?: string
  trend?: number        // positive = up, negative = down
  trendLabel?: string
  semantic?: 'default' | 'success' | 'warning' | 'destructive'
  icon?: LucideIcon
}
```

Rules:
- Value in `font-mono` always
- Trend arrow: `TrendingUp` (green) / `TrendingDown` (red) from Lucide
- `semantic` prop controls value color — never hardcode colors in the component
- Hover: `shadow-md transition-shadow duration-150`

### 4.3 Section Card (data container)

```typescript
// Standard wrapper for tables, charts, filter panels
<Card>
  <CardHeader className="flex flex-row items-center justify-between py-4 px-5">
    <div>
      <CardTitle className="text-[15px] font-semibold">{title}</CardTitle>
      {description && (
        <CardDescription className="text-xs mt-0.5">{description}</CardDescription>
      )}
    </div>
    <div className="flex items-center gap-2">
      {/* Actions: export, filter, period selector */}
    </div>
  </CardHeader>
  <CardContent className="px-5 pb-5 pt-0">
    {children}
  </CardContent>
</Card>
```

### 4.4 Interactive Card (clickable rows / drill-down)

```typescript
className={cn(
  "cursor-pointer transition-all duration-150",
  "hover:shadow-md hover:border-primary/30",
  "active:scale-[0.995]",
  isSelected && "border-primary/50 bg-primary/5 shadow-md"
)}
```

---

## 5. Table Styling

### 5.1 Standard Table Config

```typescript
// Column header: always uppercase + tracking
<TableHead className="text-xs font-semibold uppercase tracking-wide text-muted-foreground h-9 px-4">

// Data row
<TableRow className="h-11 hover:bg-muted/50 transition-colors duration-100 cursor-pointer">

// Data cell
<TableCell className="px-4 py-0 text-sm">
```

### 5.2 Density Variants

```typescript
type TableDensity = 'compact' | 'default' | 'comfortable'

const densityStyles: Record<TableDensity, string> = {
  compact:    'h-8  text-xs px-3',   // logs, audit trail
  default:    'h-11 text-sm px-4',   // main tables (standard)
  comfortable:'h-14 text-sm px-4',   // detail tables, mobile
}
```

### 5.3 Column Patterns

| Column type | Alignment | Notes |
|-------------|-----------|-------|
| Text (name, label) | Left | Default |
| Numeric (score, count) | Right + `font-mono` | Always mono |
| Date | Left | Format: `dd/MM/yyyy` |
| Status badge | Center | Badge component |
| NPS score | Right + color semantic | Badge + mono number |
| Actions | Center | `MoreHorizontal` → DropdownMenu |
| Checkbox | Center | 40px fixed width |

### 5.4 Status Badges in Tables

```typescript
// src/components/ui/status-badge.tsx
const STATUS_MAP = {
  activa:                { label: 'Activa',         class: 'bg-green-100  text-green-800  dark:bg-green-900/30  dark:text-green-400' },
  completada:            { label: 'Completada',     class: 'bg-blue-100   text-blue-800   dark:bg-blue-900/30   dark:text-blue-400'  },
  archivada:             { label: 'Archivada',      class: 'bg-slate-100  text-slate-600  dark:bg-slate-800     dark:text-slate-400' },
  pendiente:             { label: 'Pendiente',      class: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'},
  respondida:            { label: 'Respondida',     class: 'bg-green-100  text-green-800  dark:bg-green-900/30  dark:text-green-400' },
  enviado:               { label: 'Enviado',        class: 'bg-blue-100   text-blue-800   dark:bg-blue-900/30   dark:text-blue-400'  },
  recordatorio_enviado:  { label: 'Rec. enviado',   class: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-400'},
  necesidad_de_llamado:  { label: 'Llamado',        class: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400'},
  sin_respuesta:         { label: 'Sin respuesta',  class: 'bg-slate-100  text-slate-500  dark:bg-slate-800     dark:text-slate-400' },
} as const
```

### 5.5 Empty State

```typescript
// Every table must have an explicit empty state
<TableRow>
  <TableCell colSpan={columns.length} className="h-40 text-center">
    <div className="flex flex-col items-center gap-2 text-muted-foreground">
      <IconName className="size-8 opacity-40" />
      <p className="text-sm font-medium">{emptyTitle}</p>
      <p className="text-xs">{emptyDescription}</p>
      {emptyAction && (
        <Button variant="outline" size="sm" className="mt-1" onClick={emptyAction.onClick}>
          {emptyAction.label}
        </Button>
      )}
    </div>
  </TableCell>
</TableRow>
```

---

## 6. Chart Styling — Recharts Conventions

### 6.1 Base Config (apply to every chart)

```typescript
// src/lib/chart-defaults.ts
export const CHART_DEFAULTS = {
  margin:       { top: 8, right: 8, left: -16, bottom: 0 },
  gridStroke:   'hsl(var(--border))',
  gridOpacity:  0.6,
  axisStroke:   'transparent',         // no axis line
  axisTick:     'hsl(var(--muted-foreground))',
  axisTickSize: 11,
  axisFont:     'var(--font-mono)',
  animDuration: 400,
  animEasing:   'ease-in-out' as const,
  tooltipStyle: {
    backgroundColor: 'hsl(var(--card))',
    border:          '1px solid hsl(var(--border))',
    borderRadius:    '8px',
    boxShadow:       '0 4px 6px -1px rgb(0 0 0 / 0.10)',
    fontSize:        '13px',
    fontFamily:      'var(--font-sans)',
  },
}
```

### 6.2 Chart Type → Configuration Map

#### NPS Score Card (large single number)
No chart — display as KPI card with `font-mono text-4xl` and semantic color.
Add a mini sparkline only if trend data (≥ 4 points) is available.

#### NPS Distribution (promotores / neutros / detractores)
```typescript
// Horizontal stacked bar or 3-bar vertical
<BarChart layout="vertical" data={distributionData}>
  <Bar dataKey="count" fill="hsl(var(--nps-promotor))" radius={[0,4,4,0]} />
  // One bar per category, sorted: promotor → neutro → detractor
  // Always show percentage label at end of each bar
  <LabelList position="insideRight" formatter={(v) => `${v}%`}
             className="fill-white text-[11px] font-mono" />
</BarChart>
```

#### NPS por Concesionario (ranking)
```typescript
// Horizontal bar, sorted descending
<BarChart layout="vertical" data={sortedByNPS}>
  <XAxis type="number" domain={[-100, 100]} tickFormatter={(v) => `${v}`} />
  <YAxis type="category" dataKey="concesionario" width={160} tick={{ fontSize: 12 }} />
  // Bar color driven by NPS value (green / yellow / red)
  <Bar dataKey="nps" radius={[0, 4, 4, 0]}>
    <Cell fill={getColorByNPS(nps)} />  // use nps-promotor/neutro/detractor
  </Bar>
  // Reference line at 0
  <ReferenceLine x={0} stroke="hsl(var(--border))" strokeDasharray="3 3" />
</BarChart>
```

#### NPS Trend (over campaigns)
```typescript
// Line chart — avoid area fill unless single series
<LineChart>
  <Line
    type="monotone"
    dataKey="nps"
    stroke="hsl(var(--primary))"
    strokeWidth={2}
    dot={{ fill: 'hsl(var(--primary))', r: 3, strokeWidth: 0 }}
    activeDot={{ r: 5, strokeWidth: 2, stroke: 'hsl(var(--card))' }}
  />
  // Add reference line at NPS = 0 and NPS = 50
  <ReferenceLine y={0}  stroke="hsl(var(--border))" strokeDasharray="3 3" label={{ value: '0',  position: 'right', fontSize: 10 }} />
  <ReferenceLine y={50} stroke="hsl(var(--border))" strokeDasharray="3 3" label={{ value: '50', position: 'right', fontSize: 10 }} />
</LineChart>
```

#### Tasa de Respuesta
```typescript
// Radial gauge (single donut) or bullet bar
// Donut — max 2 segments: respondidas / pendientes
<RadialBarChart innerRadius="70%" outerRadius="90%">
  // Center: large % number in font-mono
  // Ring: success green for completed portion
</RadialBarChart>
// OR: simpler Progress component (CSS bar)
```

### 6.3 Universal Chart Rules

- **Grid:** horizontal lines only (`<CartesianGrid vertical={false} />`). Removes visual noise.
- **Axes:** no axis lines (`axisLine={false}`), ticks in muted color, font-mono for numbers.
- **Tooltip:** always custom `<ChartTooltipContent />` from shadcn. Never raw Recharts Tooltip.
- **Legend:** show when 2+ series. Position bottom, font 12px.
- **Empty chart:** render skeleton, not empty axes.
- **Responsive:** always wrap in `<ChartContainer>` which provides `<ResponsiveContainer>`.
- **Accessibility:** every chart has an `aria-label` and a sibling data table (hideable).
- **Animation:** `isAnimationActive={true}` duration 400ms, `easingFunction="ease-in-out"`. Disable with `prefers-reduced-motion`.

### 6.4 Chart Heights

```typescript
const CHART_HEIGHT = {
  kpiSparkline: 48,    // inline with KPI card
  compact:     180,    // secondary charts, sidebars
  standard:    260,    // main dashboard charts
  tall:        340,    // full-width primary charts
  fullWidth:   420,    // single chart pages
}
```

---

## 7. Sidebar & Navigation

### 7.1 Structure

```
┌──── Sidebar (240px) ───────────────────────────────┐
│  Logo + App name                                    │  ← 56px header
│  ─────────────────────────────────────────────────  │
│  PRINCIPAL                        (group label)     │
│  ○ Dashboard         [badge count]                  │
│  ○ NPS                                              │
│  ○ Respuestas                                       │
│  ─────────────────────────────────────────────────  │
│  OPERACIONES                      (group label)     │
│  ○ Campañas                                         │
│  ○ Clientes                                         │
│  ○ Llamados          [badge alert]                  │
│  ○ Sin respuesta                                    │
│  ─────────────────────────────────────────────────  │
│  SISTEMA                                            │
│  ○ Configuración                                    │
│  ─────────────────────────────────────────────────  │
│  User avatar + name + logout                        │  ← footer
└─────────────────────────────────────────────────────┘
```

### 7.2 Implementation

```typescript
// Always use shadcn Sidebar + SidebarProvider
<SidebarProvider>
  <AppSidebar />
  <main className="flex-1 overflow-hidden">
    <SidebarTrigger />   // mobile toggle
    {children}
  </main>
</SidebarProvider>
```

### 7.3 Nav Item Styles

```typescript
// Default
className="flex items-center gap-3 px-3 py-2 rounded-md text-sm text-sidebar-foreground
           hover:bg-sidebar-accent hover:text-white transition-colors duration-150 cursor-pointer"

// Active (current page)
className="... bg-primary/20 text-white font-medium"
// Left accent border on active:
style={{ boxShadow: 'inset 3px 0 0 hsl(var(--primary))' }}

// Group label
className="px-3 py-1.5 text-[10px] font-semibold uppercase tracking-widest
           text-sidebar-foreground/50 mt-3 first:mt-0"
```

### 7.4 Alert Badges

```typescript
// Unread count badge on sidebar items
<span className="ml-auto flex h-5 min-w-[20px] items-center justify-center
                 rounded-full bg-destructive px-1.5 text-[10px] font-semibold
                 text-white font-mono">
  {count}
</span>

// Use destructive for llamados/urgent, primary for neutral counts
```

### 7.5 Rules

- Sidebar background: always `bg-sidebar` (`#0F172A`) regardless of page theme
- Icon size: `size-4` (16px) for all nav icons — `size-5` (20px) for logo area only
- Icon library: Lucide exclusively. Never mix icon sets.
- Collapsed state: icons only, `w-14`, tooltip shows label on hover
- Mobile: Sheet overlay (not push), triggered by `SidebarTrigger`

---

## 8. Button Hierarchy

### 8.1 Button Variants — Decision Matrix

| Level | Variant | When to use | Per-view limit |
|-------|---------|-------------|----------------|
| Primary CTA | `default` | One main action per page (Create, Save, Submit) | 1 |
| Secondary CTA | `outline` | Supplementary actions (Export, Filter, Edit) | 2–3 |
| Destructive | `destructive` | Delete, remove, close campaign | 1 (behind AlertDialog) |
| Ghost | `ghost` | Tertiary, icon buttons, table row actions | Unlimited |
| Link | `link` | Navigation inside text, breadcrumbs | As needed |

```typescript
// Button sizes
size="sm"   // h-8  px-3 text-xs  — table actions, compact UI
size="default" // h-9 px-4 text-sm — standard
size="lg"   // h-10 px-6 text-sm  — primary CTA on empty state or forms
size="icon" // h-9  w-9           — icon-only, always needs aria-label
```

### 8.2 Async Button State (mandatory)

```typescript
<Button
  disabled={isPending}
  aria-busy={isPending}
>
  {isPending ? (
    <>
      <Loader2 className="size-4 animate-spin" aria-hidden />
      Guardando...
    </>
  ) : (
    <>
      <Save className="size-4" aria-hidden />
      Guardar
    </>
  )}
</Button>
```

### 8.3 Icon Button Rules

```typescript
// Always with Tooltip
<Tooltip>
  <TooltipTrigger asChild>
    <Button variant="ghost" size="icon" aria-label="Exportar CSV">
      <Download className="size-4" aria-hidden />
    </Button>
  </TooltipTrigger>
  <TooltipContent>Exportar CSV</TooltipContent>
</Tooltip>
```

---

## 9. Form Patterns

### 9.1 Standard Form Anatomy

```typescript
// Structure for all internal forms
const form = useForm<z.infer<typeof schema>>({
  resolver: zodResolver(schema),
  defaultValues: { ... }
})

<Form {...form}>
  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">

    <FormField control={form.control} name="fieldName" render={({ field }) => (
      <FormItem>
        <FormLabel>Label visible <span className="text-destructive">*</span></FormLabel>
        <FormControl>
          <Input {...field} placeholder="Placeholder descriptivo" />
        </FormControl>
        <FormDescription className="text-xs text-muted-foreground">
          Texto de ayuda si es necesario
        </FormDescription>
        <FormMessage />   {/* error inline, below field */}
      </FormItem>
    )} />

    <div className="flex items-center justify-end gap-2 pt-2">
      <Button type="button" variant="outline" onClick={onCancel}>Cancelar</Button>
      <Button type="submit" disabled={isPending}>
        {isPending ? <Loader2 className="size-4 animate-spin" /> : null}
        Guardar
      </Button>
    </div>

  </form>
</Form>
```

### 9.2 Form Layout Variants

```typescript
// Single-column (default — most forms)
className="space-y-5 max-w-md"

// Two-column (wide forms: nueva campaña, configuración)
className="grid grid-cols-1 gap-5 sm:grid-cols-2"

// Inline filter form (header of tables)
className="flex items-center gap-2 flex-wrap"
```

### 9.3 Validation Behavior

| Trigger | Rule |
|---------|------|
| On blur | Validate individual field |
| On submit | Validate entire form |
| On change | Only after first submit attempt |
| Success | `toast.success()` + reset or redirect |
| Error (server) | `toast.error()` + set server error on field |

### 9.4 Select / Combobox

- Use `<Select>` for ≤10 fixed options
- Use `<Command>` (combobox pattern) for searchable or >10 options
- Always populate `<SelectValue placeholder="Seleccionar...">` — never empty trigger

### 9.5 Required Field Indicator

```typescript
// Red asterisk on required fields
<FormLabel>
  Nombre de campaña <span className="text-destructive" aria-label="requerido">*</span>
</FormLabel>
```

---

## 10. Dark Mode Strategy

### 10.1 Approach

- **Default:** Light mode with dark sidebar (hybrid)
- **Full dark mode:** Available as user preference (`dark` class on `<html>`)
- **Sidebar:** Always dark (`bg-sidebar = #0F172A`) regardless of page theme
- **Charts:** Color tokens auto-adapt via CSS variables — no separate chart config

### 10.2 Implementation

```typescript
// No external library needed — pure CSS variables approach
// Toggle via localStorage + class on <html>

// In the root layout, read preference:
const savedTheme = localStorage.getItem('theme') ?? 'light'
document.documentElement.classList.toggle('dark', savedTheme === 'dark')
```

### 10.3 Dark Mode Verification Checklist

```
For every new component:
[ ] Test text contrast ≥ 4.5:1 in dark mode (not just light)
[ ] Borders visible in dark mode (not just light)
[ ] Shadows adjusted (dark bg needs lighter shadows or outlines)
[ ] Chart colors readable on dark background (check axis labels)
[ ] Status badges have dark: variants (defined in STATUS_MAP)
[ ] Focus rings visible on dark backgrounds
[ ] Skeleton loaders use dark:bg-muted/30
```

### 10.4 Surface Hierarchy in Dark Mode

```
Layer 0 — Page bg:      bg-background  (#0A0F1E)
Layer 1 — Cards:        bg-card        (#0F172A)
Layer 2 — Nested cards: bg-muted       (#1E293B)
Layer 3 — Tooltips/pop: bg-popover     (#0F172A + border)
Layer 4 — Sidebar:      bg-sidebar     (#070D18)
```

---

## 11. Motion Guidelines

### 11.1 Duration Scale

| Category | Duration | Easing | Examples |
|----------|----------|--------|---------|
| Micro | 100ms | `ease-out` | Focus ring, active states |
| Default | 150ms | `ease-out` | Hover, color change |
| Enter | 200ms | `ease-out` | Dropdown open, toast in |
| Exit | 150ms | `ease-in` | Dropdown close, toast out |
| Page element | 300ms | `ease-in-out` | Sheet, Dialog, Accordion |
| Data render | 400ms | `ease-in-out` | Chart initial animation |

**Rule:** Exit animations should be ~25% faster than enter. Entering feels smooth; exiting should be quick.

### 11.2 Animatable Properties Only

```css
/* ✅ Safe — GPU-composited, no layout recalculation */
transition-property: transform, opacity, background-color, border-color, color, box-shadow;

/* ❌ Never animate — triggers layout recalculation */
/* width, height, padding, margin, top, left, right, bottom */
```

### 11.3 Motion Rules

- Maximum **2 animated elements** simultaneously per view
- No `animate-bounce`, `animate-ping` on persistent UI elements
- `animate-spin` only for loading spinners (not decorative)
- Chart animations: always `isAnimationActive={!prefersReducedMotion}`
- Skeleton loaders: `animate-pulse` with `motion-reduce:animate-none`

### 11.4 Reduced Motion

```typescript
// src/hooks/use-reduced-motion.ts
export function usePrefersReducedMotion() {
  return useMediaQuery('(prefers-reduced-motion: reduce)')
}

// Apply to charts:
<Bar isAnimationActive={!prefersReducedMotion} animationDuration={400} />
```

```css
/* Tailwind: use motion-reduce: prefix on all animations */
className="animate-pulse motion-reduce:animate-none"
```

---

## 12. Accessibility Standards

### 12.1 WCAG AA Compliance (minimum target)

| Check | Standard | How to verify |
|-------|----------|---------------|
| Text contrast (normal) | ≥ 4.5:1 | Chrome DevTools / Figma contrast check |
| Text contrast (large ≥18px bold) | ≥ 3:1 | Same |
| Icon / UI element contrast | ≥ 3:1 | Same |
| Focus ring | 2px, visible, color-contrasted | Tab through page |
| Touch targets | ≥ 44×44px | Inspect element min-height |
| Keyboard navigation | Full Tab flow | Navigate without mouse |

### 12.2 Component-Level Requirements

```typescript
// Icon-only buttons — always aria-label
<Button variant="ghost" size="icon" aria-label="Eliminar campaña">
  <Trash2 className="size-4" aria-hidden="true" />
</Button>

// Charts — aria-label on container
<ChartContainer aria-label="Distribución NPS: 60% promotores, 25% neutros, 15% detractores">

// Tables — caption or aria-label
<Table aria-label="Respuestas de la campaña Q2 2026">
  <TableCaption className="sr-only">Respuestas registradas</TableCaption>

// Status that uses color alone — add text/icon
// ❌ Bad: red border only
// ✅ Good:
<span className="flex items-center gap-1 text-destructive">
  <AlertCircle className="size-3" aria-hidden />
  NPS crítico
</span>

// Error messages — live regions
<FormMessage role="alert" aria-live="polite" />

// Dialogs — shadcn handles focus trap automatically
// AlertDialog — for destructive confirmations (not Dialog)
```

### 12.3 Keyboard Navigation Map

| Element | Interaction |
|---------|-------------|
| Sidebar items | `Tab` to navigate, `Enter` to activate |
| Table rows | `Tab` to row, `Enter` to open detail |
| Table sort | `Enter` / `Space` to toggle |
| Dialog | `Escape` to close, `Tab` cycles within |
| Date pickers | Arrow keys within calendar |
| Combobox | `↓` opens, `↑↓` navigate, `Enter` selects, `Escape` closes |

### 12.4 Pre-delivery Checklist

```
Visual
[ ] No emojis as icons — Lucide only
[ ] All clickable elements have cursor-pointer
[ ] Hover states with 150ms transition
[ ] Active/pressed states visible
[ ] Disabled states: opacity-50 + cursor-not-allowed
[ ] Focus rings not removed (outline-none only with ring replacement)

Content
[ ] Icon-only buttons have aria-label
[ ] Images have meaningful alt text (or alt="" if decorative)
[ ] Form inputs have visible <label>, not just placeholder
[ ] Errors rendered with role="alert" near the field
[ ] Status communicated with text + icon, not color alone
[ ] Tables have aria-label or <caption>
[ ] Charts have aria-label describing the data

Structure
[ ] Heading hierarchy: h1 → h2 → h3 (no skips)
[ ] Landmarks: <main>, <nav>, <aside> used correctly
[ ] Skip-to-main link present in layout
[ ] Modal focus trap (shadcn Dialog handles this)
[ ] AlertDialog used for all destructive actions

Motion
[ ] prefers-reduced-motion respected on all animations
[ ] No animation longer than 400ms in UI
[ ] Loading states shown for all async operations
```

---

## 13. Page Layout Template

Every dashboard page must follow this structure:

```typescript
// app/(dashboard)/[route]/page.tsx
export default async function RoutePage() {
  return (
    <div className="flex flex-col gap-6 p-6">

      {/* ① Page Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Título</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Descripción opcional</p>
        </div>
        <div className="flex items-center gap-2">
          {/* Primary action button */}
        </div>
      </div>

      {/* ② KPI Row (when applicable) */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <KPICard ... />
      </div>

      {/* ③ Main content */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between py-4 px-5">
          <CardTitle className="text-[15px] font-semibold">Subtítulo</CardTitle>
          <div className="flex items-center gap-2">{/* filters, export */}</div>
        </CardHeader>
        <CardContent className="px-5 pb-5 pt-0">
          {/* Table or chart */}
        </CardContent>
      </Card>

    </div>
  )
}
```

---

## 14. Anti-Patterns

### Visual
| Anti-pattern | Why | Fix |
|---|---|---|
| Generic `bg-blue-500` CTA buttons | Breaks theme on dark mode, hardcoded | `bg-primary text-primary-foreground` |
| Gradients in card headers | Decorative noise in work tool | Solid `bg-card` |
| Multiple accent colors on one page | Visual chaos | Primary action = 1 color |
| Donut with 5+ segments | Unreadable slices | Horizontal bar chart |
| `z-[9999]` | Breaks stacking context | Use z-scale: 10/20/30/50 |
| Mixing Lucide + Heroicons | Inconsistent stroke width | Lucide only |
| KPI numbers in sans-serif | Harder to scan | Always `font-mono` |

### Interaction
| Anti-pattern | Why | Fix |
|---|---|---|
| Delete without AlertDialog | Accidental data loss | `AlertDialog` always |
| Submit button not disabled during async | Double-submit | `disabled={isPending}` |
| Validate only on submit | Frustrating late feedback | Validate on blur |
| Placeholder as only label | Disappears on focus, inaccessible | `<FormLabel>` visible |
| Empty table with no state | Looks like a bug | EmptyState component |
| Filters hidden in extra dropdown | Discoverability | Visible in card header |
| Toast for field validation errors | Wrong channel | `FormMessage` inline |

### Next.js / shadcn
| Anti-pattern | Fix |
|---|---|
| `'use client'` on page.tsx | Move to leaf interactive component |
| `useEffect` for initial fetch | Server Component `async/await` |
| Modifying `components/ui/` files | Extend with `className` + `cva` |
| `Dialog` for destructive confirm | `AlertDialog` |
| `Popover` for action list | `DropdownMenu` |
| Raw `<Tooltip>` without `TooltipProvider` | `<TooltipProvider>` at root layout |
| Recharts without `ChartContainer` | Always wrap with shadcn `ChartContainer` |

---

## 15. Quick Reference — Copy-paste Patterns

### NPS Color by Value
```typescript
export function getNPSVariant(score: number): 'promotor' | 'neutro' | 'detractor' {
  if (score >= 9) return 'promotor'
  if (score >= 7) return 'neutro'
  return 'detractor'
}

export function getNPSColor(score: number) {
  if (score >= 9) return 'hsl(var(--nps-promotor))'
  if (score >= 7) return 'hsl(var(--nps-neutro))'
  return 'hsl(var(--nps-detractor))'
}

// Score as signed integer for NPS formula result (-100 to 100)
export function getNPSScoreColor(nps: number) {
  if (nps >= 50) return 'hsl(var(--nps-promotor))'
  if (nps >= 0)  return 'hsl(var(--nps-neutro))'
  return 'hsl(var(--nps-detractor))'
}
```

### Skeleton Loading for Charts
```typescript
<div className="space-y-3">
  <Skeleton className="h-4 w-32" />                      // chart title
  <Skeleton className="h-[260px] w-full rounded-lg motion-reduce:animate-none" />
</div>
```

### Skeleton Loading for Tables
```typescript
Array.from({ length: rowCount }).map((_, i) => (
  <TableRow key={i}>
    {columns.map((_, j) => (
      <TableCell key={j}>
        <Skeleton className="h-4 w-full motion-reduce:animate-none"
                  style={{ width: `${60 + Math.random() * 30}%` }} />
      </TableCell>
    ))}
  </TableRow>
))
```

### Toast Patterns
```typescript
toast.success('Campaña creada correctamente')
toast.error('No se pudo guardar. Intentá de nuevo.')
toast.warning('El recordatorio ya fue enviado.')
toast.info('Se generaron 24 tokens únicos.')
// Never toast for field-level form validation — use FormMessage
```

---

*Source of truth. Do not override here — create `design-system/pages/<page>.md` for page-specific deviations.*
*UI UX Pro Max v2.5.0 — Style: Data-Dense Dashboard + Soft UI Evolution — Plataforma NPS — May 2026*
