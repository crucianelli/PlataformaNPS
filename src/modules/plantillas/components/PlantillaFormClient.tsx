'use client'

import { useActionState, useState, useCallback, useTransition } from 'react'
import type { Pregunta, SubPregunta, PreguntaTipo, NpsCampo } from '../types/plantilla.types'
import { preguntaVacia, subPreguntaVacia } from '../types/plantilla.types'

// ─── Helpers ─────────────────────────────────────────────────────────────────

const TIPO_LABELS: Record<PreguntaTipo, string> = {
  escala: 'Escala numérica',
  si_no:  'Sí / No',
  texto:  'Texto libre',
}

const TIPO_COLORS: Record<PreguntaTipo, string> = {
  escala: 'bg-blue-100 text-blue-700',
  si_no:  'bg-amber-100 text-amber-700',
  texto:  'bg-green-100 text-green-700',
}

const NPS_LABELS: Record<NpsCampo, string> = {
  nps_producto:      'NPS Producto',
  nps_empresa:       'NPS Empresa',
  nps_concesionario: 'NPS Concesionario',
}

const inputClass =
  'block w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder-muted-foreground resize-none focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20 disabled:opacity-60'

const labelClass = 'block text-xs font-medium text-muted-foreground mb-1'

// ─── Sub-pregunta card ────────────────────────────────────────────────────────

function SubPreguntaCard({
  sub,
  idx,
  onChange,
  onDelete,
}: {
  sub: SubPregunta
  idx: number
  onChange: (s: SubPregunta) => void
  onDelete: () => void
}) {
  return (
    <div className="rounded-lg border border-border bg-muted/30 p-4 space-y-3">
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-semibold text-muted-foreground">
          Sub-pregunta {idx + 1}
        </span>
        <div className="flex items-center gap-2">
          <select
            value={sub.tipo}
            onChange={(e) => onChange({ ...sub, tipo: e.target.value as 'escala' | 'texto' })}
            className="h-7 rounded-md border border-border bg-background px-2 text-xs text-foreground focus:outline-none"
          >
            <option value="escala">Escala</option>
            <option value="texto">Texto libre</option>
          </select>
          <button
            type="button"
            onClick={onDelete}
            className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:bg-red-50 hover:text-red-600 transition-colors"
          >
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
      <div>
        <label className={labelClass}>Título *</label>
        <input
          type="text"
          value={sub.titulo}
          onChange={(e) => onChange({ ...sub, titulo: e.target.value })}
          placeholder="Ej: ¿El problema fue resuelto?"
          className={inputClass}
        />
      </div>
      <div>
        <label className={labelClass}>Descripción <span className="font-normal">(opcional)</span></label>
        <input
          type="text"
          value={sub.descripcion}
          onChange={(e) => onChange({ ...sub, descripcion: e.target.value })}
          placeholder={sub.tipo === 'escala' ? 'Ej: Del 1 al 10...' : 'Ej: Describí brevemente...'}
          className={inputClass}
        />
      </div>
      <label className="flex items-center gap-2 cursor-pointer">
        <input
          type="checkbox"
          checked={sub.requerida}
          onChange={(e) => onChange({ ...sub, requerida: e.target.checked })}
          className="h-4 w-4 rounded border-border accent-brand"
        />
        <span className="text-xs text-muted-foreground">Requerida</span>
      </label>
    </div>
  )
}

// ─── Pregunta card ────────────────────────────────────────────────────────────

function PreguntaCard({
  pregunta,
  idx,
  total,
  onChange,
  onDelete,
  onMoveUp,
  onMoveDown,
}: {
  pregunta: Pregunta
  idx: number
  total: number
  onChange: (p: Pregunta) => void
  onDelete: () => void
  onMoveUp: () => void
  onMoveDown: () => void
}) {
  const [expanded, setExpanded] = useState(true)

  function updateSubSi(i: number, sub: SubPregunta) {
    const next = [...pregunta.sub_si]
    next[i] = sub
    onChange({ ...pregunta, sub_si: next })
  }

  function deleteSubSi(i: number) {
    onChange({ ...pregunta, sub_si: pregunta.sub_si.filter((_, j) => j !== i) })
  }

  function addSubSi() {
    onChange({ ...pregunta, sub_si: [...pregunta.sub_si, subPreguntaVacia()] })
  }

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      {/* Header */}
      <div
        className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-muted/30 transition-colors"
        onClick={() => setExpanded((v) => !v)}
      >
        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand/10 text-xs font-bold text-brand">
          {idx + 1}
        </span>
        <span className="flex-1 truncate text-sm font-medium text-foreground">
          {pregunta.titulo || <span className="text-muted-foreground italic">Sin título</span>}
        </span>
        <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold ${TIPO_COLORS[pregunta.tipo]}`}>
          {TIPO_LABELS[pregunta.tipo]}
        </span>
        <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
          <button type="button" disabled={idx === 0} onClick={onMoveUp}
            className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:bg-muted disabled:opacity-30 transition-colors">
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 15.75 7.5-7.5 7.5 7.5" />
            </svg>
          </button>
          <button type="button" disabled={idx === total - 1} onClick={onMoveDown}
            className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:bg-muted disabled:opacity-30 transition-colors">
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
            </svg>
          </button>
          <button type="button" onClick={onDelete}
            className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:bg-red-50 hover:text-red-600 transition-colors">
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
            </svg>
          </button>
          <svg className={`h-4 w-4 text-muted-foreground transition-transform ${expanded ? 'rotate-180' : ''}`}
            fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
          </svg>
        </div>
      </div>

      {/* Body */}
      {expanded && (
        <div className="border-t border-border px-4 py-4 space-y-4">
          {/* Tipo */}
          <div className="flex gap-3">
            <div className="flex-1">
              <label className={labelClass}>Tipo de pregunta</label>
              <select
                value={pregunta.tipo}
                onChange={(e) => onChange({ ...pregunta, tipo: e.target.value as PreguntaTipo, sub_si: [] })}
                className={inputClass}
              >
                <option value="escala">Escala numérica (1-10)</option>
                <option value="si_no">Sí / No</option>
                <option value="texto">Texto libre</option>
              </select>
            </div>
            {pregunta.tipo === 'escala' && (
              <div className="w-32">
                <label className={labelClass}>Campo NPS</label>
                <select
                  value={pregunta.nps_campo ?? ''}
                  onChange={(e) => onChange({ ...pregunta, nps_campo: (e.target.value || null) as NpsCampo | null })}
                  className={inputClass}
                >
                  <option value="">Ninguno</option>
                  {(Object.entries(NPS_LABELS) as [NpsCampo, string][]).map(([k, v]) => (
                    <option key={k} value={k}>{v}</option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Título */}
          <div>
            <label className={labelClass}>Título *</label>
            <textarea
              rows={2}
              value={pregunta.titulo}
              onChange={(e) => onChange({ ...pregunta, titulo: e.target.value })}
              placeholder="Ej: ¿Qué tan probable es que recomiendes el producto?"
              className={inputClass}
            />
          </div>

          {/* Descripción */}
          <div>
            <label className={labelClass}>Descripción <span className="font-normal">(opcional)</span></label>
            <input
              type="text"
              value={pregunta.descripcion}
              onChange={(e) => onChange({ ...pregunta, descripcion: e.target.value })}
              placeholder="Ej: Donde 1 es muy improbable y 10 muy probable."
              className={inputClass}
            />
          </div>

          {/* Escala min/max */}
          {pregunta.tipo === 'escala' && (
            <div className="flex gap-3">
              <div className="w-24">
                <label className={labelClass}>Mínimo</label>
                <input
                  type="number" min={0} max={5}
                  value={pregunta.escala_min}
                  onChange={(e) => onChange({ ...pregunta, escala_min: Number(e.target.value) })}
                  className={inputClass}
                />
              </div>
              <div className="w-24">
                <label className={labelClass}>Máximo</label>
                <input
                  type="number" min={5} max={10}
                  value={pregunta.escala_max}
                  onChange={(e) => onChange({ ...pregunta, escala_max: Number(e.target.value) })}
                  className={inputClass}
                />
              </div>
            </div>
          )}

          {/* Requerida */}
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={pregunta.requerida}
              onChange={(e) => onChange({ ...pregunta, requerida: e.target.checked })}
              className="h-4 w-4 rounded border-border accent-brand"
            />
            <span className="text-sm text-muted-foreground">Obligatoria</span>
          </label>

          {/* Sub-preguntas (si_no) */}
          {pregunta.tipo === 'si_no' && (
            <div className="space-y-3">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                Sub-preguntas (se muestran si el cliente responde «Sí»)
              </p>
              {pregunta.sub_si.map((sub, i) => (
                <SubPreguntaCard
                  key={sub.id}
                  sub={sub}
                  idx={i}
                  onChange={(s) => updateSubSi(i, s)}
                  onDelete={() => deleteSubSi(i)}
                />
              ))}
              <button
                type="button"
                onClick={addSubSi}
                className="flex items-center gap-2 rounded-lg border border-dashed border-border px-3 py-2 text-sm text-muted-foreground hover:border-brand hover:text-brand transition-colors w-full justify-center"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                </svg>
                Agregar sub-pregunta
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

interface Props {
  action: (prev: { error?: string; success?: boolean }, fd: FormData) => Promise<{ error?: string; success?: boolean }>
  initialNombre?: string
  initialIntroduccion?: string
  initialPreguntas?: Pregunta[]
  id?: string
  readOnly?: boolean
  submitLabel?: string
}

export default function PlantillaFormClient({
  action,
  initialNombre = '',
  initialIntroduccion = '',
  initialPreguntas = [],
  id,
  readOnly = false,
  submitLabel = 'Guardar',
}: Props) {
  const [preguntas, setPreguntas] = useState<Pregunta[]>(initialPreguntas)
  const [state, formAction, isPending] = useActionState(action, {})
  const [, startTransition] = useTransition()

  const updatePregunta = useCallback((idx: number, p: Pregunta) => {
    setPreguntas((prev) => prev.map((x, i) => (i === idx ? p : x)))
  }, [])

  const deletePregunta = useCallback((idx: number) => {
    setPreguntas((prev) => prev.filter((_, i) => i !== idx))
  }, [])

  const moveUp = useCallback((idx: number) => {
    if (idx === 0) return
    setPreguntas((prev) => {
      const next = [...prev]
      ;[next[idx - 1], next[idx]] = [next[idx], next[idx - 1]]
      return next
    })
  }, [])

  const moveDown = useCallback((idx: number) => {
    setPreguntas((prev) => {
      if (idx >= prev.length - 1) return prev
      const next = [...prev]
      ;[next[idx], next[idx + 1]] = [next[idx + 1], next[idx]]
      return next
    })
  }, [])

  function addPregunta() {
    setPreguntas((prev) => [...prev, preguntaVacia()])
  }

  return (
    <form
      action={(fd) => {
        fd.set('preguntas_json', JSON.stringify(preguntas))
        startTransition(() => { formAction(fd) })
      }}
      className="space-y-5"
    >
      {id && <input type="hidden" name="id" value={id} />}

      {/* Nombre */}
      <div>
        <label className="block text-sm font-medium text-foreground mb-1.5">
          Nombre de la plantilla *
        </label>
        <input
          name="nombre"
          type="text"
          defaultValue={initialNombre}
          required
          disabled={readOnly || isPending}
          placeholder="Ej: Seguimiento Post Venta"
          className={inputClass}
        />
      </div>

      {/* Introducción */}
      <div>
        <label className="block text-sm font-medium text-foreground mb-1.5">
          Texto de introducción <span className="text-muted-foreground font-normal">(opcional)</span>
        </label>
        <textarea
          name="introduccion"
          rows={3}
          defaultValue={initialIntroduccion}
          disabled={readOnly || isPending}
          placeholder="Mensaje que verá el cliente al abrir la encuesta..."
          className={inputClass}
        />
      </div>

      {/* Preguntas */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-foreground">
            Preguntas <span className="text-muted-foreground font-normal">({preguntas.length})</span>
          </h3>
        </div>

        {preguntas.length === 0 && (
          <div className="rounded-xl border border-dashed border-border py-10 text-center text-sm text-muted-foreground">
            No hay preguntas. Agregá la primera.
          </div>
        )}

        {preguntas.map((p, idx) => (
          <PreguntaCard
            key={p.id}
            pregunta={p}
            idx={idx}
            total={preguntas.length}
            onChange={(p) => updatePregunta(idx, p)}
            onDelete={() => deletePregunta(idx)}
            onMoveUp={() => moveUp(idx)}
            onMoveDown={() => moveDown(idx)}
          />
        ))}

        {!readOnly && (
          <button
            type="button"
            onClick={addPregunta}
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-border py-3 text-sm text-muted-foreground hover:border-brand hover:text-brand transition-colors"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            Agregar pregunta
          </button>
        )}
      </div>

      {/* Feedback */}
      {state?.error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {state.error}
        </div>
      )}
      {state?.success && (
        <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
          Plantilla guardada correctamente.
        </div>
      )}

      {!readOnly && (
        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={isPending}
            className="inline-flex items-center gap-2 rounded-lg bg-brand px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-brand/90 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isPending ? (
              <>
                <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Guardando...
              </>
            ) : (
              <>
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V7l-4-4Z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17 3v4H9V3" />
                </svg>
                {submitLabel}
              </>
            )}
          </button>
        </div>
      )}
    </form>
  )
}
