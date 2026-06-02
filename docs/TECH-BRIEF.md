# Documentación Técnica — Plataforma NPS Crucianelli

**Fecha:** mayo 2026  
**Versión:** 1.0  
**Preparado para:** revisión técnica con equipo de IT

---

## 1. Qué resuelve esta plataforma

Crucianelli enviaba encuestas NPS de forma manual: Google Forms para capturar respuestas, Google Sheets para hacer el seguimiento. El proceso era manual, sin trazabilidad, sin alertas y difícil de escalar.

Esta plataforma centraliza todo:

- Se crea una campaña y se importan los clientes
- El sistema genera un link único por cliente (token UUID)
- Los links se envían por fuera (WhatsApp, email, lo que sea)
- Los clientes responden desde el link sin necesidad de login
- Todo queda registrado: respuestas, recordatorios, llamados, métricas
- Si algún NPS es bajo, llega un alerta automático por email

La unidad operativa principal es la **OF** (Orden de Fabricación). Cada OF genera un link único que se puede compartir por hasta 3 teléfonos. El primero que responde cierra la encuesta.

---

## 2. Stack tecnológico

| Capa | Tecnología | Por qué |
|------|------------|---------|
| Frontend | Next.js 15 (App Router) | Server Components nativos, sin necesidad de API layer separado |
| Lenguaje | TypeScript estricto | Tipos generados desde Supabase, errores en compilación no en runtime |
| Estilos | Tailwind CSS v4 | Utilidades atómicas, sin CSS custom |
| Base de datos | Supabase PostgreSQL | RLS nativo, pg_cron, tipos generados automáticamente |
| Auth | Supabase Auth | JWT + cookies, integración nativa con el middleware de Next.js |
| Email | Nodemailer (SMTP) | Alertas NPS crítico y notificaciones |
| Validación | Zod | Schemas en Server Actions, validación en el edge antes de tocar DB |
| Deploy | Vercel (Next.js) + Supabase self-hosted | Supabase corriendo en servidor propio (no Supabase cloud) |

---

## 3. Arquitectura general

### 3.1 Principio base: server-first

El diseño está orientado al servidor:

- **Server Components**: leen datos directamente desde la base sin pasar por una API. No generan bundle en el cliente.
- **Server Actions**: mutan datos (crear campaña, guardar respuesta). Corren en servidor, se llaman desde formularios del cliente.
- **No hay una capa REST propia.** Las dos únicas rutas API (`/api/campanas/[id]/exportar` y `/api/respuestas/exportar`) existen solo para descargar archivos CSV con autenticación.

### 3.2 Dos clientes de Supabase, dos contextos

```
src/lib/supabase/server.ts
├── createSupabaseServer()   → usa anon key + cookies de sesión (usuario autenticado)
└── createSupabaseAdmin()    → usa service_role key (solo servidor, sin restricciones RLS)
```

- `createSupabaseServer()` se usa en el dashboard: respeta RLS, accede como el usuario logueado.
- `createSupabaseAdmin()` se usa en el formulario público y alertas: bypasa RLS porque esas operaciones no tienen sesión de usuario. **Nunca puede ejecutarse desde el cliente.**

### 3.3 Flujo de una respuesta (camino crítico)

```
Cliente abre /encuesta?token=<uuid>
       ↓
Server Component valida token con createSupabaseAdmin()
       ↓
¿Token inválido?        → 404 personalizado
¿Encuesta respondida?   → "Ya completaste esta encuesta"
¿sin_respuesta?         → "Este link ya fue cerrado"
¿Pendiente?             → Renderiza formulario
       ↓
Cliente completa y envía el formulario
       ↓
guardarRespuestaAction() (Server Action)
  1. Validación Zod del payload completo
  2. Re-validación del token en servidor (doble check)
  3. Verificación de que no existe respuesta previa (doble check)
  4. INSERT en respuestas
       ↓
  Trigger PostgreSQL: fn_marcar_encuesta_respondida()
       → encuestas.estado = 'respondida'
       ↓
  ¿NPS producto, empresa o concesionario < 6?
       → Alerta SMTP a emails_notificacion de system_config
       ↓
  Auto-completar campaña si no quedan encuestas pendientes
       ↓
Pantalla de éxito
```

---

## 4. Base de datos

### 4.1 Tablas principales

```sql
clientes     → nombre, telefono_1/2/3, concesionario, of (orden de fabricación), tecnologia
campanas     → nombre, fecha, estado (activa | completada | archivada)
encuestas    → cliente_id, campana_id, token UUID ÚNICO, estado
respuestas   → encuesta_id UNIQUE, nps_producto, nps_empresa, nps_concesionario, + datos del cliente
envios       → cliente_id, campana_id, numero_recordatorio (0-3), estado_envio, fecha_envio
system_config → dias_notificacion, emails_notificacion[], dias_hasta_llamado
```

### 4.2 Estados de una encuesta (`encuesta_estado`)

```
pendiente → [cliente respondió]  → respondida
pendiente → [3er recordatorio]   → necesidad_de_llamado  (pg_cron, cada 15 min)
necesidad_de_llamado → [operador cierra] → sin_respuesta
```

### 4.3 Constraints de negocio en DB (no solo en código)

- `UNIQUE (cliente_id, campana_id)` en `encuestas` → una sola encuesta por cliente por campaña
- `UNIQUE` en `encuesta_id` en `respuestas` → una sola respuesta por encuesta
- `CHECK (numero_recordatorio BETWEEN 0 AND 3)` → máximo 3 recordatorios
- `UNIQUE (cliente_id, campana_id, numero_recordatorio)` en `envios` → sin duplicados

### 4.4 Triggers activos

**`trg_marcar_encuesta_respondida`**  
Se ejecuta después de cada INSERT en `respuestas`. Actualiza `encuestas.estado = 'respondida'` automáticamente. La aplicación no lo hace manualmente.

**`trg_system_config_updated_at`**  
Actualiza `updated_at` en `system_config` antes de cada UPDATE.

**`sync_encuestas_necesidad_llamado()`** (pg_cron, cada 15 min)  
Busca encuestas en estado `recordatorio_enviado` cuyo último recordatorio superó el plazo configurado en `dias_hasta_llamado` y las pasa a `necesidad_de_llamado`.

### 4.5 Vistas

- `v_encuestas_completas` → JOIN de encuestas + clientes + campañas + respuestas (lectura de dashboard)
- `v_nps_por_campana` → agrupado por campaña con promedios y score NPS calculado

Ambas usan `security_invoker = true`: respetan las políticas RLS del usuario que las consulta.

---

## 5. Seguridad

### 5.1 Capas de protección

```
1. Middleware (Next.js)
   → Verifica sesión JWT en cada request
   → Rutas públicas: /login y /encuesta
   → Todo lo demás redirige a /login si no hay sesión

2. RLS (Row Level Security) en PostgreSQL
   → Habilitado en las 6 tablas
   → Usuario anónimo: solo puede leer su propia encuesta por token
   → Usuario autenticado: acceso completo (admin)
   → INSERT en respuestas: solo desde service_role (Server Action)

3. Double-check en Server Action
   → Token revalidado en servidor (no se confía en el cliente)
   → Respuesta previa verificada antes de insertar

4. service_role estrictamente en servidor
   → createSupabaseAdmin() lanza error si se llama desde window (browser)
   → service_role no aparece en ningún bundle de cliente
```

### 5.2 Política RLS para el formulario público

```sql
CREATE POLICY "encuestas_select_by_token"
ON encuestas FOR SELECT TO anon
USING (
  token = (
    SELECT (current_setting('request.jwt.claims', true)::json->>'token')::uuid
  )
);
```

Permite que un usuario anónimo lea solo la encuesta cuyo token coincide con el claim JWT. Es la segunda capa de defensa; la validación principal la hace el Server Component con service_role.

### 5.3 APIs protegidas

`/api/campanas/[id]/exportar` y `/api/respuestas/exportar` verifican sesión con `createSupabaseServer().auth.getUser()` antes de devolver cualquier dato.

### 5.4 Hardening aplicado (migración 010)

- `search_path` fijado en funciones SECURITY DEFINER (anti-hijacking de esquema)
- EXECUTE revocado de funciones internas para `PUBLIC`, `anon` y `authenticated`
- Política `encuestas_select_by_token` optimizada para evaluar `current_setting` una sola vez

---

## 6. Módulos de la aplicación

### 6.1 Campañas (`/campanas`)

- Listado con estado y métricas básicas
- Crear campaña: nombre + fecha + upload CSV
- El CSV normaliza encabezados, detecta separador `;` o `,`, agrupa por OF, admite hasta 3 teléfonos
- Al crear campaña se generan: clientes, encuestas (1 por OF) y envíos iniciales
- El token se genera una vez. **Nunca se regenera.**

### 6.2 Recordatorios (`/campanas/[id]/recordatorio`)

- Máximo 3 por campaña
- No se puede crear el siguiente si el anterior no fue confirmado como enviado
- El operador exporta pendientes a CSV, los envía por fuera, y confirma en el sistema
- Los recordatorios usan el **mismo token** que el envío original

### 6.3 Llamados (`/llamados`)

- Cuando una encuesta pasa a `necesidad_de_llamado`, aparece aquí
- El operador puede abrir el formulario público (asistido) o cerrar como `sin_respuesta`
- Si se responde en modo llamado, `canal_respuesta = 'llamado'` queda registrado

### 6.4 NPS (`/nps`)

- NPS general + por producto (sembradoras / fertilizadoras) + por concesionario + empresa
- Fórmula: `NPS = % promotores (9-10) - % detractores (0-6)`
- Filtros: concesionario, tipo de máquina, tecnología, rango de fechas
- Ranking de concesionarios con mejor/peor performance

### 6.5 Respuestas (`/respuestas`)

- Tabla con búsqueda, filtros múltiples y detalle expandido
- Exportación a CSV respetando filtros activos

### 6.6 Configuración (`/configuracion`)

- Días de notificación inicial y entre recordatorios
- Días hasta derivar a llamado
- Lista de emails para alertas NPS crítico
- Test SMTP

---

## 7. Flujos de negocio críticos

### 7.1 Regla de token único

```typescript
// Antes de crear una encuesta, se verifica si ya existe una para ese cliente en esa campaña
const { data: existente } = await supabase
  .from('encuestas')
  .select('token')
  .eq('cliente_id', clienteId)
  .eq('campana_id', campanaId)
  .single()

if (existente) return existente.token  // reutilizar, nunca regenerar
```

Reforzado además por el constraint `UNIQUE (cliente_id, campana_id)` en la tabla.

### 7.2 Doble validación de respuesta

La Server Action `guardarRespuestaAction` verifica en dos pasos antes de insertar:
1. Estado de `encuestas.estado` (debe ser `pendiente`)
2. Existencia de fila en `respuestas` para esa encuesta

El constraint `UNIQUE` en `respuestas.encuesta_id` actúa como tercera línea de defensa a nivel DB.

### 7.3 Alerta NPS crítico

```typescript
const esNPSCritico = nps_producto <= 6 || nps_empresa <= 6 || nps_concesionario <= 6
if (esNPSCritico) {
  await enviarAlertaNpsCritico({ ... })
}
```

Destinatarios siempre desde `system_config.emails_notificacion`. No hay emails hardcodeados.

### 7.4 Auto-completar campaña

Después de cada respuesta, el sistema verifica si quedan encuestas pendientes. Si todas están en `respondida` o `sin_respuesta`, la campaña pasa automáticamente a `completada`.

---

## 8. Deuda técnica conocida

Estas son las cosas que el sistema no hace todavía o que pueden mejorarse:

| Punto | Detalle |
|-------|---------|
| Sin tests automáticos | No hay tests para parser CSV, cálculo NPS, recordatorios ni bloqueo de doble respuesta |
| RLS permisivas para autenticados | Los advisors de Supabase reportan que las políticas de `authenticated` son amplias (full access para admin es intencional, pero se puede granularizar) |
| `clientes` debería ser `OF` | La tabla `clientes` representa Órdenes de Fabricación, no clientes en sentido CRM |
| `dias_notificacion_*` sin automatización completa | Los parámetros existen en config pero no disparan envíos automáticos, solo gobiernan la lógica de llamados |
| `comentario_general` huérfano | Existe en DB, el formulario actual no lo usa |
| Índices no usados | Bajo volumen de datos; los índices son correctos pero no se ejercitan aún |

---

## 9. Convenciones de código

### Estructura de módulos

```
src/modules/[modulo]/
├── components/    → componentes React del módulo
├── services/      → lógica de negocio + queries a Supabase
├── types/         → tipos TypeScript del módulo
└── hooks/         → React hooks (cuando aplica)
```

**Regla de aislamiento:** un módulo no importa de otro módulo. Lo compartido va a `src/components/` o `src/lib/`.

### Naming

- Server Actions: `[verbo][Entidad]Action` → `guardarRespuestaAction`, `crearCampanaAction`
- Servicios: `[entidad].service.ts` → `campanas.service.ts`
- Componentes: PascalCase → `RecordatoriosTimeline.tsx`

---

## 10. Comandos principales

```bash
# Desarrollo
npm run dev

# Validar antes de mergear
npm run lint
npm run build

# Base de datos (Supabase self-hosted)
npx supabase db push                 # aplicar migraciones al proyecto remoto
npx supabase gen types typescript --linked > src/types/database.types.ts
```

> **Nota:** Supabase corre en infraestructura propia (self-hosted), no en Supabase cloud. Esto significa control total sobre la instancia PostgreSQL, sin dependencia del servicio cloud de Supabase. Las Edge Functions y pg_cron corren en el mismo servidor.

---

## 11. Variables de entorno

| Variable | Tipo | Uso |
|----------|------|-----|
| `NEXT_PUBLIC_SUPABASE_URL` | pública | URL del proyecto Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | pública | Anon key, sujeta a RLS |
| `SUPABASE_SERVICE_ROLE_KEY` | **privada** | Bypasa RLS, solo en servidor |
| `NEXT_PUBLIC_APP_URL` | pública | URL de producción (para armar links de encuesta) |
| `SMTP_*` | privadas | Credenciales para alertas por email |

`SUPABASE_SERVICE_ROLE_KEY` nunca debe aparecer en bundle del cliente. Hay un guard explícito en `createSupabaseAdmin()` que lanza error si se intenta usar desde browser.

---

## 12. Preguntas frecuentes que pueden surgir

**¿Por qué no hay una API REST propia?**  
Next.js App Router permite consultar la base directamente desde Server Components. No hay necesidad de un BFF separado para este caso de uso.

**¿Por qué service_role bypasa RLS?**  
Porque el formulario público no tiene sesión de usuario autenticado. RLS no puede verificar `auth.uid()`. Se usa service_role exclusivamente en Server Actions que ya tienen validación propia (doble check del token).

**¿Cómo se evita que alguien responda dos veces?**  
Tres capas: (1) el estado de `encuestas.estado` se valida en la Server Action, (2) se busca si ya existe una fila en `respuestas`, (3) el constraint `UNIQUE (encuesta_id)` en la tabla rechaza el INSERT duplicado a nivel DB.

**¿Por qué no se regenera el token si el cliente no responde?**  
El token es el identificador permanente del cliente en esa campaña. Regenerarlo rompería la trazabilidad (los recordatorios usan el mismo token). Si no responde, la encuesta pasa a `sin_respuesta`.

**¿Qué pasa si la campaña tiene 1000 clientes y todos responden el mismo día?**  
Cada respuesta es una transacción independiente. El trigger y el check de doble respuesta son operaciones de fila única. Supabase PostgreSQL maneja la concurrencia correctamente con el constraint UNIQUE.
