import { NextResponse } from 'next/server'

/**
 * Lo usaba la versión anterior de `mensajes.py` para avisar que arrancaba y que
 * terminaba. La reemplazó `/ejecucion`, que además impide que corran dos
 * scripts a la vez sobre el mismo job.
 *
 * Queda contestando para que un script viejo frene **antes de mandar nada**, con
 * un mensaje que diga qué hacer — en vez de un 404 mudo. El script viejo llama
 * acá antes del primer mensaje e imprime el `error` de la respuesta.
 */
export async function POST() {
  return NextResponse.json(
    {
      error:
        'Esta versión de mensajes.py quedó vieja. Copiá la nueva (scripts/whatsapp/mensajes.py del repo) en la carpeta del script y volvé a ejecutar.',
    },
    { status: 410 },
  )
}
