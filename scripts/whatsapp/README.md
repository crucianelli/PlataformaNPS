# `mensajes.py` — el agente de envío de WhatsApp

Este script **no corre en el servidor**: corre en la PC Windows del operador, y
es el que realmente manda los mensajes. La plataforma solo prepara la lista.

## Por qué vive afuera

No automatiza ninguna API de WhatsApp. Abre Chrome en `web.whatsapp.com`, mueve
el mouse a coordenadas de pantalla y pega la imagen y el texto por el
portapapeles de Windows. Necesita una pantalla real, un mouse real y una sesión
de WhatsApp abierta — y mientras corre, la PC no se puede usar para otra cosa.

Por eso no se puede "mover a un contenedor": para centralizar el envío hay que
reemplazar el emisor, no mudarlo. Ver `docs/06-migracion-self-hosted.md`.

## El ritmo

Hasta octubre de 2026, 32 mensajes llevaban **una hora y media**. Casi nada de ese
tiempo era "no parecer un robot":

| Por mensaje | Antes | Ahora |
|---|---|---|
| Esperar que cargue el chat | 25-35s | 15-20s |
| Escribir el mensaje | ~25s, tecla por tecla | ~1s, pegado |
| Espera hasta el siguiente | 30-60s | 8-16s |
| Pausa larga | 2-4 min cada 4 | 1-2 min cada 10 |

Desde el lado de WhatsApp, entre un mensaje y el siguiente pasan unos 40
segundos (carga del chat + espera), siempre distintos. 32 mensajes llevan ~25-30
minutos; el script muestra la estimación al arrancar.

**Tipear tecla por tecla además rompía los mensajes.** `pyautogui.write` solo sabe
escribir ASCII y saltea el resto sin avisar: los emojis, la "¡", las tildes y la
"ñ" no llegaban ("Se cumplió un año" salía "Se cumpli un ao"). Pegando llega el
texto exacto de la plantilla.

Todo se ajusta desde el `.env`, sin tocar el código (rangos en segundos):

```
ESPERA_PRIMER_CHAT=30-40      # el primero tarda más: puede que Chrome ni esté abierto
ESPERA_CARGA_CHAT=15-20       # subirlo si en esa PC los chats tardan en abrir
ESPERA_ENTRE_MENSAJES=8-16
PAUSA_LARGA=60-120
PAUSA_LARGA_CADA=10
```

Para volver al ritmo viejo: `ESPERA_CARGA_CHAT=25-35`, `ESPERA_ENTRE_MENSAJES=30-60`,
`PAUSA_LARGA=120-240`, `PAUSA_LARGA_CADA=4`.

**Ojo con `ESPERA_CARGA_CHAT`:** el script no ve la pantalla. Si pega antes de que
el chat termine de cargar, el mensaje no sale y el script igual lo marca como
enviado. Si alguna vez falta un mensaje en un chat, subir ese valor.

## Cómo obtiene los datos

Antes leía y escribía Supabase directo, con la `service_role_key` en un `.env` en
el escritorio del operador — una llave con acceso total a la base. Ahora habla con
la plataforma, con un token que solo abre estos endpoints:

| Llamada | Para qué |
|---|---|
| `POST /api/whatsapp/agente/jobs/:id/ejecucion` | `tomar` el job al arrancar, dar `senal` de vida cada 5s, `soltar` al salir. Ver "Detener y reanudar". |
| `GET  /api/whatsapp/agente/jobs/:id` | El job, y **solo los contactos que faltan**, con el mensaje ya renderizado. |
| `POST /api/whatsapp/agente/contactos/:id` | Reportar cómo salió cada contacto. |

`POST /jobs/:id/estado` era de la versión anterior: ahora responde 410 con un
mensaje que pide actualizar el script, así una copia vieja frena antes de mandar
nada.

Tres cosas quedaron del lado del servidor a propósito:

- **El mensaje se renderiza allá.** El reemplazo de `{nombre}` y `{url}` estaba
  duplicado acá en Python y en `renderizar.ts`. Ahora hay una sola copia.
- **Los contadores los calcula el servidor**, recontando las filas. Antes el
  script leía el contador y lo escribía +1 en dos llamadas sueltas: un corte en
  el medio los dejaba mintiendo.
- **El GET devuelve solo pendientes**, así relanzar un job cortado nunca le
  vuelve a escribir a quien ya recibió el mensaje.

## Instalación

1. Copiar `mensajes.py` a la carpeta donde ya estaba el anterior.
2. En esa misma carpeta, un `.env`:
   ```
   PLATAFORMA_URL=https://plataforma.crucianelli.site
   WHATSAPP_AGENTE_TOKEN=<el mismo que está en el servidor>
   ```
3. El `launcher.bat` y el protocolo `whatsapp-sender://` no cambian. La pantalla
   `/whatsapp/setup` de la plataforma tiene los pasos.

## Si algo falla

- **`❌ La plataforma rechazó el token (401)`** — el `WHATSAPP_AGENTE_TOKEN` del
  `.env` no coincide con el del servidor.
- **`❌ No se pudo contactar a la plataforma`** — la PC no llega a la URL, o
  `PLATAFORMA_URL` está mal escrita.
- **`⛔ Este envío ya lo está mandando otra ventana del script`** — hay otra
  ventana del script viva con ese job. Si se la acaba de cerrar, esperar un
  minuto (o hasta que la pantalla diga "Interrumpido") y reanudar.
- **`❌ La plantilla lleva la imagen '...', pero no está en ...`** — antes se
  mandaba sin imagen sin avisar; ahora no manda nada. Copiar la imagen a la
  carpeta del script, o sacársela a la plantilla.
- **`❌ La plataforma respondió 410`** — es una copia vieja de `mensajes.py`.
  Reemplazarla por la de este directorio.
- **`⚠️ ATENCIÓN: no se pudo registrar el resultado de este contacto`** — el
  mensaje se mandó pero la plataforma no se enteró (se reintenta 3 veces antes de
  darse por vencido). Importa: si relanzás el job, a esa persona le llega dos
  veces. El aviso incluye el id del contacto para poder marcarlo a mano.

## Detener y reanudar

Antes andaba mal de dos maneras:

- **"Detener" tardaba minutos.** El script se fijaba recién al terminar el
  contacto en curso, y si estaba en la pausa larga podían ser seis minutos.
- **"Reanudar" podía arrancar un segundo script.** Mientras el primero seguía
  andando, la pantalla ya mostraba el botón. El segundo volvía a poner el job "en
  progreso", y el primero, al chequear, lo veía en progreso y seguía de largo: dos
  scripts manejando el mismo mouse y el mismo teclado.

Ahora **el job tiene dueño**. Cada corrida del script se presenta con un id propio
(`tomar`), avisa cada 5 segundos que sigue viva (`senal`) y suelta el job al salir
(`soltar`). Mientras el dueño esté vivo nadie más puede tomarlo: una segunda
ventana dice "⛔ Este envío ya lo está mandando otra ventana" y se cierra sin
tocar nada.

La señal de vida es también cómo se entera de un "Detener", y se manda durante
todas las esperas: el script para en unos segundos. Lo único que no se corta es
el pegado de un mensaje (unos 5 segundos), para no dejar un mensaje a medias en
el chat de un cliente.

Lo que muestra la pantalla del job sale de esto, no solo del estado guardado:

| Pantalla | Qué pasa | Botón |
|---|---|---|
| En progreso | el script está mandando | Detener |
| Deteniendo… | se apretó Detener y el script está terminando | — |
| Interrumpido | el script soltó el job y quedan pendientes | Reanudar |
| El script no responde | "en progreso" pero sin señales hace más de un minuto: se cerró la ventana sin avisar, se apagó la PC o se cortó internet | Reanudar |
| Completado | no queda nadie pendiente | — |

Cerrar la ventana del script también lo frena: Windows le da unos segundos y los
usa para soltar el job. Si ni eso pudo (corte de luz), al minuto sin señales el
job se puede retomar igual.

**El estado final lo decide la base, no el script**: `completado` solo si no quedó
ningún contacto pendiente; si no, `interrumpido`. Antes el script decía cómo
terminó, y eso dio dos bugs: un envío detenido a la mitad figuraba "Completado"
(en staging había dos, de 3 sobre 8 y 1 sobre 10), y uno detenido justo en el
último mensaje quedaba "Interrumpido" para siempre.

La lógica de tomar/señal/soltar vive en SQL
(`supabase/migrations/20261023000000_whatsapp_ejecucion_unica.sql`), porque se
mide con el reloj de la base — el de la VPS no tiene NTP y el de la PC es otro — y
porque la comparte la versión de producción del script, que habla directo con
Supabase.

**Freno de emergencia:** llevar el mouse a una esquina de la pantalla corta el
script en el acto (es de `pyautogui`). El job queda detenido y se puede reanudar.
