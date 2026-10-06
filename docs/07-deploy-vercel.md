# Deploy en Vercel — puente por la caída de la VPS

**Fecha:** 2026-09-02. **Estado:** en producción, funcionando.
**URL:** https://plataforma-nps.vercel.app

Documento operativo de un desvío temporal, no de un cambio de rumbo. La
migración a infraestructura propia sigue viva en `feature/migracion-self-hosted`
y en `docs/06-migracion-self-hosted.md`; esto no la reemplaza ni la cancela.

---

## 1. Por qué

La VPS dejó de responder (ni HTTPS en `posventa.portalcrucianelli.site` ni SSH
en el puerto `5399`) y con ella se cayó producción. La plataforma quedó
inaccesible: sin dashboard, y sin formulario público para los clientes que
tenían una encuesta pendiente.

El dato que definió el plan: **el cutover a infra propia nunca se hizo**, así
que los datos y el auth de producción **siguen viviendo en Supabase Cloud**, que
está sano. O sea que lo caído era solamente el lugar donde corre el contenedor
de Next.js — no la base. Reemplazar ese lugar por Vercel restaura el servicio
sin migrar un solo dato.

Es explícitamente temporal: hasta que vuelva la VPS o la empresa cambie de
proveedor.

## 2. Qué se deployó, y por qué `main` y no la rama de migración

Se deployó **`main`** (commit `5bb4c5b`), que es exactamente el código que corría
en producción. Se descartó deployar `feature/migracion-self-hosted` por tres
razones, cualquiera de ellas suficiente:

1. **Su Postgres está en la VPS caída.** Habría que levantar un Postgres
   administrado nuevo, aplicar migraciones, copiar los datos desde Supabase y
   correr `scripts/migrar-usuarios-auth.ts`. Es hacer el cutover a las apuradas,
   sin backups resueltos (sección 7.1 del doc 06) y en el peor momento posible.
2. **Sería un retroceso funcional.** `main` tiene 5 commits que la rama no
   tiene: efectividad por tipo de encuesta en el dashboard, tipo de máquina en
   clientes/importación/llamados, y el cambio de regalo a Mini Ball en Rambla.
3. **Contradice el objetivo.** Mudar la base a otro proveedor administrado no
   acerca a "todo en infraestructura propia"; solo cambia de quién se depende.

**Consecuencia a tener presente:** el fix de autorización `18fb57f` (guardas de
rol en los 34 server actions y los 7 route handlers) vive en la rama, **no en
`main`**. Es aceptable acá porque en `main` sigue activo el RLS de Supabase, que
es justamente la red que se perdió al migrar y que motivó ese fix — pero no es
lo mismo que estar cubierto: RLS protege la base, no las reglas de rol de la
app. Ver la sección 15 del doc 06.

## 3. Configuración en Vercel

- **Proyecto:** `plataforma-nps` (scope `renzo's projects`).
  `projectId=prj_VVrNksC8AwPcEoMROsTUwpVIGZF6`,
  `orgId=team_dHUtuz8oOQJd0Q1HO7UNmlaY`. Los IDs quedan acá porque un worktree
  descartable no tiene `.vercel/` y hay que poder revincularlo sin prompts.
- **Framework:** Next.js, autodetectado. Sin `vercel.json`: no hace falta.
- **Existe otro proyecto `nps`** en la misma cuenta, de abril, con Framework
  Preset "Other" (mal configurado, nunca sirvió) y 103 días sin tocarse. **No es
  este.** Se dejó quieto para no romper nada por las dudas.

### Variables de entorno (scope Production)

Las 10 que `main` realmente lee, tomadas de `.env.local`:

| Variable | Nota |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | apunta al Supabase de producción |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | |
| `SUPABASE_SERVICE_ROLE_KEY` | |
| `SMTP_HOST` / `SMTP_PORT` / `SMTP_SECURE` / `SMTP_USER` / `SMTP_PASS` | Gmail |
| `EMAIL_FROM` | |
| `NEXT_PUBLIC_APP_URL` | `https://plataforma-nps.vercel.app` |

Están cargadas **solo en Production**, a propósito: si estuvieran también en
Preview, cualquier deploy de prueba escribiría en la base real y mandaría mails
de verdad a los 18 destinatarios de `system_config`.

### Gotcha: `NEXT_PUBLIC_*` no puede ser "sensitive"

Vercel ahora marca toda variable nueva como *sensitive* por defecto, y rechaza
esa combinación con el prefijo público:

```
invalid_visibility: Environment variables with a public framework prefix
(NEXT_PUBLIC) cannot use secret visibility on Production or Preview.
```

Tiene sentido —una `NEXT_PUBLIC_*` termina en el bundle del navegador, no hay
secreto que guardar— pero el error frena el `vercel env add` sin explicar el
flag. Las tres públicas se cargan con `--visibility config --no-sensitive`.

**Al verificar, ojo con `vercel env pull`: redacta las sensibles** (devuelve
`"[SENSITIVE]"`). Comparar checksums contra `.env.local` da "todas distintas" y
parece un desastre; en realidad son todas iguales entre sí, al hash de
`[SENSITIVE]`. Las públicas sí se pueden comparar de verdad.

## 4. Cómo redeployar

```bash
./deploy-vercel.sh
```

Deploya **siempre `main`**, sin importar en qué rama estés parado: arma un
worktree descartable de `main` en `/tmp`, lo vincula al proyecto y deploya desde
ahí. Es el guard invertido de `deploy.sh` (que exige estar en `main`): acá no
hace falta cambiar de rama, y mandar la rama de migración a producción por
accidente es imposible. Probado de punta a punta.

Las variables no se pasan desde el script — viven en el proyecto de Vercel.

## 5. Lo que NO se tocó (y no hacía falta tocar)

- **Los 2 jobs de `pg_cron`** (`sync-encuestas-necesidad-llamado` cada 15 min,
  `check-campanas-sin-actividad` diario). Son SQL puro adentro de la base, sin
  `pg_net` ni llamadas HTTP: corren en Supabase y no se enteran de dónde vive la
  app. Verificado leyendo las migraciones `008`, `010` y `014`.
- **`mensajes.py`**, el agente de WhatsApp de la PC del operador. En `main`
  habla directo con la API REST de Supabase, no con la app. No hay que tocarle
  el `.env`.
- **Supabase Cloud**: ni una migración, ni un dato movido.

## 6. Pendientes y limitaciones conocidas

1. **Los links de encuesta ya enviados están rotos.** Apuntan a
   `posventa.portalcrucianelli.site`, que es la VPS caída. Ningún cliente con
   una encuesta pendiente puede responder hasta que ese dominio vuelva a
   resolver — sea porque revive la VPS o porque IT apunta el DNS a Vercel.
   **Es la única pérdida funcional real de este puente.** Los links *nuevos* ya
   salen con el dominio de Vercel.
2. **Reset de contraseña: falta autorizar el dominio en Supabase.**
   `solicitarRecuperacionAction` arma el `redirectTo` desde el header `host`
   (`src/app/login/actions.ts:41`), así que se adapta solo al dominio nuevo —
   pero Supabase solo redirige a URLs de su allow-list. Hay que agregar
   `https://plataforma-nps.vercel.app/**` en **Authentication → URL
   Configuration → Redirect URLs**. Sin eso el mail de reset manda al dominio
   viejo, que no responde. El login normal no depende de esto.
3. **Jobs de WhatsApp viejos**: los que ya estaban creados guardaron
   `url_encuesta` con el dominio viejo. Los nuevos salen bien.
4. **La cuenta de Vercel es personal** (`rekoasef` / "renzo's projects"), no de
   la empresa, y ahí corre una app con datos personales de clientes reales.
   Conviene resolverlo (cuenta/team de la empresa) antes de que "temporal" se
   vuelva permanente. Revisar también qué permite el plan de esa cuenta para uso
   comercial.
5. **Deploy manual.** Lo durable es conectar el repo de GitHub
   (`crucianelli/PlataformaNPS`) al proyecto de Vercel: push a `main` →
   deploy, que es el reemplazo natural de Watchtower. Requiere autorizar la app
   de Vercel en la organización de GitHub.

## 7. Cómo se vuelve atrás

Cuando la VPS vuelva, no hay nada que desarmar: `deploy.sh` sigue intacto y
Watchtower sigue mirando `crucianelli/npsplatform:latest`. Alcanza con levantar
la VPS y verificar que `posventa.portalcrucianelli.site` responde. Vercel puede
quedar como está (no molesta) o pausarse.

Si en cambio la empresa cambia de proveedor, este deploy es el que sostiene el
servicio mientras tanto, y la decisión de fondo sigue siendo la del doc 06.
