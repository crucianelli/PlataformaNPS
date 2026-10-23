import { NextResponse } from 'next/server'
import { z } from 'zod'
import { esAgenteAutorizado } from '@/lib/auth/agente'
import { senalJob, soltarJob, tomarJob } from '@/modules/whatsapp/services/whatsapp.service'

const BodySchema = z.object({
  accion: z.enum(['tomar', 'senal', 'soltar']),
  ejecucion_id: z.guid(),
})

/**
 * El ciclo de vida de una corrida del script sobre un job:
 *
 * - `tomar` al arrancar → `{ resultado: 'ok' | 'ocupado' | 'sin_pendientes' }`.
 *   Con `ocupado` el script no hace nada: hay otra ventana mandando este job.
 * - `senal` cada pocos segundos → `{ resultado: 'seguir' | 'detenido' | 'reemplazado' }`.
 *   Es a la vez la señal de vida y la forma de enterarse de que lo frenaron.
 * - `soltar` al salir, por la razón que sea → `{ estado }`, el estado que quedó.
 *
 * Todos los resultados van con 200: son respuestas normales, no errores.
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!esAgenteAutorizado(request)) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  const { id } = await params
  // Un id que no tiene forma de UUID haría explotar la consulta con un 500; es
  // un job que no existe. `guid` y no `uuid`: el de zod 4 exige versión y
  // variante RFC, y acá alcanza con lo que Postgres acepta.
  if (!z.guid().safeParse(id).success) {
    return NextResponse.json({ error: 'Job no encontrado' }, { status: 404 })
  }

  const parsed = BodySchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 })
  }

  const { accion, ejecucion_id } = parsed.data

  if (accion === 'tomar') {
    const resultado = await tomarJob(id, ejecucion_id)
    if (resultado === 'no_existe') return NextResponse.json({ error: 'Job no encontrado' }, { status: 404 })
    return NextResponse.json({ resultado })
  }

  if (accion === 'senal') {
    return NextResponse.json({ resultado: await senalJob(id, ejecucion_id) })
  }

  const estado = await soltarJob(id, ejecucion_id)
  if (!estado) return NextResponse.json({ error: 'Job no encontrado' }, { status: 404 })
  return NextResponse.json({ estado })
}
