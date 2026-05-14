# UI/UX Guidelines — Plataforma NPS

Guía interna generada con UI UX Pro Max v2.5.0 y adaptada a este proyecto específico.
Leer antes de crear o modificar cualquier componente visual.

---

## 1. Contexto del Proyecto

| Atributo | Valor |
|----------|-------|
| Tipo | Plataforma interna empresarial |
| Audiencia | Operadores y analistas internos (Crucianelli) |
| Orientación | Analytics / Dashboard / Datos operacionales |
| Stack | Next.js 15 · React 19 · TypeScript · Tailwind v4 · shadcn/ui · Recharts · Supabase |

El producto no es un SaaS de cara al público. Es una herramienta de trabajo de alta densidad informativa. Las decisiones de diseño deben favorecer la **claridad operacional** sobre la expresividad visual.

---

## 2. Sistema de Diseño Base

### 2.1 Estilo Principal — Data-Dense Dashboard

El estilo aprobado para este proyecto es **Data-Dense Dashboard**:

- Múltiples widgets y tarjetas KPI en la misma vista
- Tablas de datos, filtros y métricas en espacios compactos
- Padding mínimo, grillas eficientes, máxima visibilidad de datos
- Modo claro como principal (el fondo de pantalla en oficinas favorece el modo claro)

### 2.2 Paleta de Colores

```css
/* globals.css — :root */
--color-primary:        #1E40AF;   /* Azul institucional */
--color-primary-hover:  #1D3FAA;
--color-secondary:      #3B82F6;   /* Azul interactivo */
--color-accent:         #D97706;   /* Ámbar — CTA y alertas */
--color-background:     #F8FAFC;   /* Fondo general */
--color-surface:        #FFFFFF;   /* Tarjetas y paneles */
--color-muted:          #E9EEF6;   /* Fondo de elementos secundarios */
--color-border:         #DBEAFE;   /* Bordes */
--color-foreground:     #1E293B;   /* Texto principal */
--color-muted-fg:       #64748B;   /* Texto secundario */
--color-destructive:    #DC2626;   /* Acciones destructivas */
--color-success:        #16A34A;   /* Confirmaciones */
--color-warning:        #D97706;   /* Alertas y advertencias */

/* NPS específicos */
--color-nps-promotor:   #16A34A;   /* 9–10 */
--color-nps-neutro:     #D97706;   /* 7–8 */
--color-nps-detractor:  #DC2626;   /* 0–6 */
```

**Regla:** Nunca usar hex directamente en componentes. Siempre usar variables CSS o clases semánticas de Tailwind (`bg-primary`, `text-destructive`).

### 2.3 Tipografía

Fuente principal: **Inter** (sans-serif, ya incluida en Next.js via `next/font`).

```typescript
// app/layout.tsx
import { Inter } from 'next/font/google'
const inter = Inter({ subsets: ['latin'], display: 'swap' })
```

Escala tipográfica:

| Token | Tamaño | Uso |
|-------|--------|-----|
| `text-xs` | 12px | Etiquetas de gráficos, metadatos |
| `text-sm` | 14px | Texto de tablas, formularios |
| `text-base` | 16px | Cuerpo general (mínimo para legibilidad) |
| `text-lg` | 18px | Títulos de sección |
| `text-xl` | 20px | Títulos de página |
| `text-2xl` | 24px | KPIs grandes |
| `text-3xl+` | 30px+ | Score NPS principal |

**Regla:** Nunca usar `text-xs` para texto que el usuario debe leer de corrido. Solo para etiquetas de apoyo.

### 2.4 Sistema de Espaciado

Grilla base: **4px / 8px**.

| Token Tailwind | Valor | Uso |
|----------------|-------|-----|
| `gap-1` / `p-1` | 4px | Espaciado interno mínimo (iconos, badges) |
| `gap-2` / `p-2` | 8px | Espaciado entre elementos relacionados |
| `gap-4` / `p-4` | 16px | Padding de tarjetas, secciones internas |
| `gap-6` / `p-6` | 24px | Separación entre grupos de contenido |
| `gap-8` / `p-8` | 32px | Separación entre secciones mayores |

**Regla:** Nunca usar valores arbitrarios (`p-[13px]`) a menos que sea necesario por compatibilidad con un componente externo. Si hacés eso más de una vez, creá un token.

---

## 3. Cómo Invocar el Skill

El skill se activa automáticamente para cualquier tarea de UI/UX. Para resultados óptimos:

### Prompts recomendados

```bash
# Para generar o regenerar el design system del proyecto
python3 ~/.claude/skills/ui-ux-pro-max-skill/src/ui-ux-pro-max/scripts/search.py \
  "enterprise internal dashboard NPS analytics operational data" \
  --design-system -p "PlataformaNPS" -f markdown

# Para buscar patrones de charts específicos
python3 ~/.claude/skills/ui-ux-pro-max-skill/src/ui-ux-pro-max/scripts/search.py \
  "bar comparison ranking NPS" --domain chart

# Para buscar mejores prácticas UX por tema
python3 ~/.claude/skills/ui-ux-pro-max-skill/src/ui-ux-pro-max/scripts/search.py \
  "form validation accessibility error" --domain ux

# Para guidelines de Next.js específicas
python3 ~/.claude/skills/ui-ux-pro-max-skill/src/ui-ux-pro-max/scripts/search.py \
  "server components suspense loading" --stack nextjs

# Para guidelines de shadcn/ui
python3 ~/.claude/skills/ui-ux-pro-max-skill/src/ui-ux-pro-max/scripts/search.py \
  "form table dialog sidebar" --stack shadcn
```

### Patrones de prompt al pedir componentes

```
# Bien — describe el contexto y el stack
"Crear una tarjeta KPI que muestre el score NPS con color dinámico según el valor.
Stack: shadcn/ui, Tailwind v4, Recharts. El valor va de -100 a 100."

# Bien — incluye el patrón visual esperado
"Tabla de respuestas con paginación, filtros laterales y exportación CSV.
Debe seguir el estilo Data-Dense Dashboard del proyecto."

# Mal — muy vago
"Hacé algo lindo para mostrar el NPS"
```

---

## 4. Principios de UI/UX para Este Proyecto

### 4.1 Densidad informativa primero

Este es un panel de trabajo, no una landing page. La densidad es una feature, no un defecto:

- Las tablas deben mostrar el máximo de filas útiles sin scroll innecesario
- Los KPIs deben estar juntos para comparación rápida
- Los filtros deben estar visibles, no escondidos detrás de un botón extra

### 4.2 Estado del sistema siempre visible

Los usuarios operativos necesitan saber:
- Cuántas encuestas quedan pendientes (badge en sidebar)
- En qué estado está una campaña (colores de estado en tabla)
- Si una acción está en progreso (loading states en botones)

### 4.3 Flujos críticos sin fricción

Los flujos más usados deben requerir el mínimo de clics:
- Crear campaña + cargar CSV: máximo 3 pasos
- Ver respuesta individual: click directo desde tabla
- Exportar pendientes: un botón visible en la vista de campaña

### 4.4 Alertas y estados negativos claramente diferenciados

Los valores NPS críticos (< 6) deben saltar visualmente sin ambigüedad:
- `text-destructive` + icono para NPS detractor
- `text-warning` + icono para NPS neutro
- `text-success` + icono para NPS promotor

Nunca usar solo color para comunicar estado (accesibilidad).

---

## 5. Componentes — Estructura Recomendada

### 5.1 Jerarquía de componentes

```
src/
├── components/
│   ├── ui/              ← shadcn/ui instalados (no modificar manualmente)
│   └── layout/          ← Sidebar, Header, PageContainer
├── modules/
│   └── [modulo]/
│       └── components/  ← Componentes del módulo
└── app/
    └── (dashboard)/
        └── [ruta]/
            └── _components/  ← Componentes colocados junto a la ruta
```

**Regla crítica:** Un módulo no importa de otro módulo. Si un componente se necesita en dos módulos, moverlo a `src/components/`.

### 5.2 Convenciones de componentes

```typescript
// ✅ Bien — props tipadas, className extensible con cn()
import { cn } from '@/lib/utils'

interface NPSBadgeProps {
  score: number
  className?: string
}

export function NPSBadge({ score, className }: NPSBadgeProps) {
  const variant = score >= 9 ? 'promotor' : score >= 7 ? 'neutro' : 'detractor'
  return (
    <span className={cn(
      'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
      variant === 'promotor' && 'bg-green-100 text-green-800',
      variant === 'neutro'   && 'bg-yellow-100 text-yellow-800',
      variant === 'detractor'&& 'bg-red-100 text-red-800',
      className
    )}>
      {score}
    </span>
  )
}

// ❌ Mal — lógica de estilo con ternarios anidados sin cn()
<span style={{ backgroundColor: score >= 9 ? 'green' : score >= 7 ? 'yellow' : 'red' }}>
```

### 5.3 shadcn/ui — reglas de uso

| Necesidad | Componente correcto | No usar |
|-----------|--------------------|---------| 
| Modal de confirmación destructiva | `AlertDialog` | `Dialog` |
| Panel lateral de filtros | `Sheet` | `Dialog` |
| Menú de acciones en tabla | `DropdownMenu` | `Popover` |
| Formulario con validación | `Form` + `zodResolver` | `useState` manual |
| Hint sobre ícono | `Tooltip` + `TooltipProvider` | `title=""` |
| Estado de carga de tarjeta | `Skeleton` | spinner genérico |
| Notificación de éxito/error | `toast.success()` / `toast.error()` de Sonner | `Alert` inline |
| Navegación principal | `Sidebar` + `SidebarProvider` | `div` fijo |

**Instalar siempre via CLI:**
```bash
npx shadcn@latest add [component-name]
```

### 5.4 Formularios

```typescript
// Patrón estándar para todos los formularios
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form'

const form = useForm<FormValues>({
  resolver: zodResolver(formSchema),
  defaultValues: { ... }
})
```

- Siempre usar `FormLabel` visible — nunca `placeholder` como único label
- Errores con `FormMessage` debajo de cada campo, no todos arriba
- Botón de submit con estado `disabled` durante el proceso async
- Feedback con `toast.success()` / `toast.error()` al completar

---

## 6. Dashboard y Gráficos

### 6.1 Selección de chart por caso de uso

| Necesidad | Chart recomendado | Biblioteca |
|-----------|------------------|------------|
| NPS score único (KPI) | Número grande + color semántico | Sin chart |
| Distribución detractores/neutros/promotores | Bar horizontal o Donut (≤3 segmentos) | Recharts |
| NPS por concesionario (ranking) | Bar horizontal ordenado desc | Recharts |
| Evolución NPS en el tiempo | Line Chart | Recharts |
| Tasa de respuesta | Waffle o Bullet Chart | Recharts / CSS Grid |
| Comparativa entre campañas | Grouped Bar | Recharts |

### 6.2 Implementación con shadcn/ui + Recharts

```typescript
// ✅ Usar siempre ChartContainer de shadcn (envuelve Recharts con tema)
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart'

const chartConfig = {
  promotores: { label: 'Promotores', color: 'var(--color-nps-promotor)' },
  neutros:    { label: 'Neutros',    color: 'var(--color-nps-neutro)' },
  detractores:{ label: 'Detractores',color: 'var(--color-nps-detractor)' },
} satisfies ChartConfig

// ❌ No usar Recharts directamente sin ChartContainer
<ResponsiveContainer width="100%" height={300}>
  <BarChart data={data}>
```

### 6.3 Reglas para gráficos accesibles

- Nunca usar solo color para distinguir series — agregar pattern o estilo de línea diferente
- Siempre mostrar valor numérico como texto además del visual (tooltip obligatorio)
- Legend siempre visible, no solo en hover
- Donut/Pie: máximo 5 segmentos. Más de 5 → Bar horizontal
- Para tablas comparativas, siempre ofrecer export CSV como alternativa

### 6.4 Estados de carga de gráficos

```typescript
// Skeleton que respeta las dimensiones del chart real
<Skeleton className="h-[300px] w-full rounded-lg" />

// No usar spinner para reemplazar gráficos completos
```

---

## 7. Tablas de Datos

Las tablas son el componente más usado en esta plataforma. Reglas específicas:

### 7.1 Estructura

```typescript
// Usar Table de shadcn + TanStack Table para tablas con sort/filter/paginación
import { useReactTable, getCoreRowModel, getSortedRowModel } from '@tanstack/react-table'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table'
```

### 7.2 UX de tablas

- **Filas hover:** `hover:bg-muted/50` siempre activado
- **Filas clickeables:** `cursor-pointer` en `TableRow`
- **Columnas de estado:** usar badges de color, no texto plano
- **Columnas de fecha:** formato consistente (`dd/MM/yyyy`)
- **Columnas de NPS:** mostrar número + badge de color
- **Columna de acciones:** siempre última columna, icono `MoreHorizontal` con `DropdownMenu`
- **Tabla vacía:** mostrar estado explícito con mensaje y acción sugerida, nunca tabla vacía sin mensaje
- **Paginación:** controles visibles, mostrar total de registros

### 7.3 Filtros

- Filtros frecuentes (campaña, concesionario) como selects visibles en el header de la tabla
- Filtros adicionales (fecha, tecnología) en `Sheet` lateral activable
- Búsqueda libre: `Input` con icono `Search` y debounce de 300ms

---

## 8. Navegación y Layout

### 8.1 Sidebar

- Siempre usar el componente `Sidebar` de shadcn/ui con `SidebarProvider`
- Ancho colapsado en mobile, expandido en desktop
- Badge con conteo sobre ítems con datos pendientes (ej: "Llamados" con `count`)
- Ítem activo con `bg-primary/10 text-primary font-medium`

### 8.2 Header de página

Cada ruta del dashboard debe tener:
```typescript
<PageHeader>
  <PageTitle>Nombre de la sección</PageTitle>
  <PageActions>
    {/* Botones de acción principal de la página */}
  </PageActions>
</PageHeader>
```

### 8.3 z-index scale

| Capa | z-index | Token Tailwind |
|------|---------|----------------|
| Base | 0 | - |
| Dropdown / Tooltip | 10 | `z-10` |
| Sticky header de tabla | 20 | `z-20` |
| Sidebar | 30 | `z-30` |
| Modal / Sheet | 50 | `z-50` |
| Toast | 100 | (manejado por Sonner) |

**Nunca usar `z-[9999]`.**

---

## 9. Animaciones y Transiciones

### 9.1 Timing

| Tipo | Duración | Easing |
|------|----------|--------|
| Micro-interacción (hover, foco) | 150ms | `ease-out` |
| Transición de componente (modal, sheet) | 200–300ms | `ease-out` |
| Animación de datos (chart render) | 400ms | `ease-in-out` |
| Nada más lento que esto en UI | — | — |

### 9.2 Reglas

```css
/* ✅ Propiedades seguras para animar (no causan repaint) */
transition: transform, opacity, background-color;

/* ❌ Evitar animar estas propiedades */
transition: width, height, top, left, margin, padding;
```

- Respetar `prefers-reduced-motion` — Tailwind tiene la clase `motion-reduce:transition-none`
- Máximo 2 elementos animados simultáneamente en una vista
- No usar `animate-bounce` ni `animate-ping` en elementos de UI permanentes

---

## 10. Accesibilidad

### 10.1 Contraste mínimo (WCAG AA)

| Contexto | Ratio mínimo |
|----------|-------------|
| Texto normal (< 18px) | 4.5:1 |
| Texto grande (≥ 18px bold) | 3:1 |
| Iconos y elementos UI | 3:1 |

Los colores del sistema ya cumplen WCAG AA. No los modificar sin verificar contraste.

### 10.2 Checklist pre-entrega

```
[ ] Sin emojis como iconos — usar Lucide (ya incluido en shadcn)
[ ] cursor-pointer en todos los elementos clickeables
[ ] Hover states con transición 150-300ms
[ ] Contraste de texto ≥ 4.5:1
[ ] Focus states visibles (no remover outline sin reemplazar)
[ ] Botones con iconos solos tienen aria-label
[ ] Inputs tienen <label> visible, no solo placeholder
[ ] Errores de formulario con role="alert" o aria-live
[ ] Tablas con <caption> o aria-label descriptivo
[ ] Modales hacen trap de foco (shadcn Dialog lo hace automático)
[ ] Acciones destructivas con AlertDialog (no Dialog genérico)
[ ] Loading buttons disabled durante async (evitar doble submit)
[ ] Estados vacíos con mensaje y acción
[ ] prefers-reduced-motion respetado
```

### 10.3 Iconos

- Biblioteca oficial del proyecto: **Lucide** (`lucide-react`, incluida con shadcn)
- Tamaños estándar: `size={16}` (inline), `size={20}` (botones), `size={24}` (standalone)
- Iconos solos en botones: siempre con `aria-label` o `<Tooltip>`

---

## 11. Anti-patrones a Evitar

### Visuales

| Anti-patrón | Motivo | Alternativa |
|-------------|--------|-------------|
| Emojis como iconos de UI | Inconsistentes entre plataformas, no controlables con tokens | Lucide icons |
| Colores hardcodeados (`bg-blue-500`) | No respetan el tema, difícil de mantener | Variables CSS / clases semánticas |
| Gradientes decorativos en cabeceras | Ruido visual en herramienta de trabajo | Fondo sólido o muted |
| Donut/Pie con más de 5 segmentos | Ilegibles | Bar horizontal |
| Texto `< 12px` para contenido real | Ilegible en pantallas de baja resolución | Mínimo `text-sm` (14px) |
| `z-[9999]` | Rompe el stacking context | z-index scale definido |

### De interacción

| Anti-patrón | Motivo | Alternativa |
|-------------|--------|-------------|
| Acciones destructivas sin confirmación | Pérdida de datos accidental | `AlertDialog` siempre |
| Botón de submit sin estado loading | Permite doble submit | `disabled + spinner` |
| Formularios que solo validan al submit | Feedback tardío | Validación on-blur |
| Filtros escondidos en dropdown no obvio | Usuarios no los descubren | Filtros visibles en header |
| Paginación sin total de registros | El usuario no sabe cuánto hay | "Mostrando X de Y resultados" |
| Tabla vacía sin mensaje | Parece un bug | Empty state con acción |

### De Next.js / shadcn

| Anti-patrón | Alternativa |
|-------------|-------------|
| `'use client'` en páginas enteras | Solo en hojas del árbol (componentes interactivos) |
| `useEffect` para fetch inicial | Server Component con `async/await` |
| Modificar archivos de `components/ui/` | Extender con `className` o `cva` |
| Importar todo de un barrel (`@/components/ui`) | Importar componente por componente |
| `Dialog` para confirmaciones destructivas | `AlertDialog` |
| `Popover` para menú de acciones | `DropdownMenu` |

---

## 12. Consistencia Entre Páginas

### 12.1 Patrón de página estándar

```typescript
// Estructura que deben seguir todas las páginas del dashboard
export default async function MiPaginaPage() {
  const data = await miServicio.getData()   // fetch en Server Component

  return (
    <PageContainer>
      <PageHeader>
        <PageTitle>Título de Página</PageTitle>
        <PageActions>
          <Button>Acción Principal</Button>
        </PageActions>
      </PageHeader>

      <div className="space-y-6">
        {/* Métricas / KPIs (si aplica) */}
        <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {/* Cards de KPI */}
        </section>

        {/* Contenido principal */}
        <Card>
          <CardHeader>
            {/* Filtros */}
          </CardHeader>
          <CardContent>
            {/* Tabla o lista */}
          </CardContent>
        </Card>
      </div>
    </PageContainer>
  )
}
```

### 12.2 Cards de KPI

Todas las tarjetas de métricas deben seguir el mismo patrón visual:
- Header: label descriptivo + icono
- Valor principal: `text-2xl font-bold`
- Subtexto: comparativa o contexto en `text-muted-foreground text-sm`
- Color del valor según semántica (verde/amarillo/rojo para NPS)

### 12.3 Badges de estado

Usar siempre los mismos tokens para los mismos estados:

| Estado | Clases |
|--------|--------|
| `activa` / `enviado` / `respondida` | `bg-green-100 text-green-800` |
| `pendiente` / `recordatorio_enviado` | `bg-yellow-100 text-yellow-800` |
| `necesidad_de_llamado` | `bg-orange-100 text-orange-800` |
| `sin_respuesta` / `archivada` | `bg-gray-100 text-gray-600` |
| Error / destructivo | `bg-red-100 text-red-800` |

### 12.4 Mensajes de éxito y error

```typescript
// Éxito
toast.success('Campaña creada correctamente')

// Error controlado
toast.error('No se pudo guardar. Intentá de nuevo.')

// Error por validación (inline, en el formulario)
// → usar FormMessage de shadcn, no toast
```

---

## 13. Formulario Público de Encuesta (`/encuesta`)

Esta ruta es pública y tiene reglas de diseño distintas al dashboard:

- Fondo neutro, sin sidebar ni header de navegación
- Formulario centrado, máximo `max-w-2xl`
- Texto de preguntas en `text-base` o mayor — se lee en móvil
- Escala NPS: botones numerados 0–10, tamaño mínimo `44x44px` en mobile
- Estados de bloqueo (ya respondida, token inválido) con mensajes claros y sin opciones de acción confusas
- No añadir branding complejo — es una herramienta funcional

---

## 14. Workflow con el Skill

### Para nuevas páginas

1. Correr el script de design system con el contexto específico
2. Identificar el tipo de vista (tabla, dashboard, formulario, detalle)
3. Usar el patrón de página estándar del punto 12.1
4. Verificar la checklist del punto 10.2 antes de cerrar la tarea

### Para nuevos componentes

1. Verificar si shadcn/ui ya tiene el componente (`npx shadcn@latest add`)
2. Si no existe, buscar el patrón en el skill: `--domain ux` o `--stack shadcn`
3. Extender con `cn()` y `cva`, no modificar los archivos base
4. Documentar en el módulo si el componente tiene lógica de negocio específica

### Para revisión de UI existente

```bash
# Buscar anti-patrones en UX
python3 ~/.claude/skills/ui-ux-pro-max-skill/src/ui-ux-pro-max/scripts/search.py \
  "animation accessibility z-index loading forms" --domain ux
```

Pasar la checklist del punto 10.2 sobre el componente revisado.

---

*Generado con UI UX Pro Max v2.5.0 — Design system: Data-Dense Dashboard — Mayo 2026*
