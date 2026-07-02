'use client'

import { useState } from 'react'
import type { Pregunta, SubPregunta } from '../types/plantilla.types'

// ─── Shared UI ────────────────────────────────────────────────────────────────

const inputClass =
  'block w-full rounded-lg border border-gray-300 bg-white px-3.5 py-2.5 text-sm text-gray-900 placeholder-gray-400 transition-colors focus:border-[#C0272D] focus:outline-none focus:ring-2 focus:ring-[#C0272D]/20 disabled:opacity-50'

function Card({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`bg-white rounded-2xl border border-gray-100 shadow-sm p-6 ${className}`}>
      {children}
    </div>
  )
}

function SeccionHeader({ numero, titulo }: { numero: number; titulo: string }) {
  return (
    <div className="flex items-start gap-3 mb-5">
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#C0272D] text-sm font-bold text-white mt-0.5">
        {numero}
      </span>
      <h3 className="text-base font-semibold text-gray-900 leading-snug">{titulo}</h3>
    </div>
  )
}

// ─── Escala ───────────────────────────────────────────────────────────────────

function EscalaSelector({
  name, label, min = 1, max = 10, required, disabled, preview,
}: {
  name: string; label: string; min?: number; max?: number
  required?: boolean; disabled?: boolean; preview?: boolean
}) {
  const [selected, setSelected] = useState<number | null>(null)

  function getColor(n: number, isSelected: boolean) {
    if (!isSelected) return 'bg-white border-gray-300 text-gray-600 hover:border-[#C0272D] hover:text-[#C0272D] hover:bg-red-50'
    if (n <= 6) return 'bg-[#C0272D] border-[#C0272D] text-white shadow-md'
    if (n <= 8) return 'bg-amber-500 border-amber-500 text-white shadow-md'
    return 'bg-green-600 border-green-600 text-white shadow-md'
  }

  return (
    <div className="space-y-4">
      {label && <p className="text-sm text-gray-600 leading-relaxed">{label}</p>}
      <div className="flex flex-wrap gap-2">
        {Array.from({ length: max - min + 1 }, (_, i) => i + min).map((n) => (
          <label key={n} className={preview ? 'cursor-default' : 'cursor-pointer'}>
            {!preview && (
              <input
                type="radio" name={name} value={n} required={required} disabled={disabled}
                className="sr-only" onChange={() => setSelected(n)}
              />
            )}
            <span className={`flex items-center justify-center h-12 w-12 rounded-xl border-2 text-base font-bold transition-all select-none ${disabled ? 'opacity-50 cursor-not-allowed' : ''} ${getColor(n, selected === n)}`}>
              {n}
            </span>
          </label>
        ))}
      </div>
      <div className="flex justify-between text-xs text-gray-400 pt-1">
        <span>{min} = Muy insatisfecho / Muy improbable</span>
        <span>{max} = Muy satisfecho / Muy probable</span>
      </div>
    </div>
  )
}

// ─── Pregunta individual ──────────────────────────────────────────────────────

function PreguntaBlock({
  pregunta,
  numero,
  disabled,
  preview,
}: {
  pregunta: Pregunta
  numero: number
  disabled?: boolean
  preview?: boolean
}) {
  const [tuvoSi, setTuvoSi] = useState<boolean | null>(null)

  if (pregunta.tipo === 'escala') {
    return (
      <Card>
        <SeccionHeader numero={numero} titulo={pregunta.titulo} />
        <EscalaSelector
          name={pregunta.id}
          label={pregunta.descripcion}
          min={pregunta.escala_min}
          max={pregunta.escala_max}
          required={pregunta.requerida}
          disabled={disabled}
          preview={preview}
        />
      </Card>
    )
  }

  if (pregunta.tipo === 'si_no') {
    return (
      <Card>
        <SeccionHeader numero={numero} titulo={pregunta.titulo} />
        <div className="flex gap-3 mb-4">
          {['si', 'no'].map((val) => {
            const esSi = val === 'si'
            const active = esSi ? tuvoSi === true : tuvoSi === false
            return (
              <label key={val} className={`flex-1 ${preview ? 'cursor-default' : 'cursor-pointer'}`}>
                {!preview && (
                  <input
                    type="radio" name={pregunta.id} value={val}
                    required={pregunta.requerida} disabled={disabled}
                    className="sr-only"
                    onChange={() => setTuvoSi(esSi)}
                  />
                )}
                <span className={`flex items-center justify-center gap-2 h-11 rounded-xl border-2 text-sm font-semibold transition-all select-none
                  ${active
                    ? esSi
                      ? 'border-[#C0272D] bg-red-50 text-[#C0272D]'
                      : 'border-green-600 bg-green-50 text-green-700'
                    : 'border-gray-300 text-gray-600 hover:border-gray-400'
                  } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}>
                  {esSi ? 'Sí, tuve problemas' : 'No tuve problemas'}
                </span>
              </label>
            )
          })}
        </div>

        {/* Sub-preguntas */}
        {pregunta.sub_si.length > 0 && (tuvoSi === true || preview) && (
          <div className="mt-4 space-y-5 rounded-xl border border-red-100 bg-red-50/40 p-5">
            {pregunta.sub_si.map((sub) => (
              <SubPreguntaBlock key={sub.id} sub={sub} disabled={disabled} preview={preview} />
            ))}
          </div>
        )}
      </Card>
    )
  }

  if (pregunta.tipo === 'texto') {
    return (
      <Card>
        <SeccionHeader numero={numero} titulo={pregunta.titulo} />
        {pregunta.descripcion && (
          <p className="text-sm text-gray-600 mb-3">{pregunta.descripcion}</p>
        )}
        <textarea
          name={pregunta.id}
          rows={3}
          required={pregunta.requerida && !preview}
          disabled={disabled}
          readOnly={preview}
          placeholder={pregunta.descripcion || 'Escribe tu respuesta aquí...'}
          className={`${inputClass} resize-none`}
        />
      </Card>
    )
  }

  return null
}

function SubPreguntaBlock({
  sub, disabled, preview,
}: {
  sub: SubPregunta; disabled?: boolean; preview?: boolean
}) {
  if (sub.tipo === 'escala') {
    return (
      <div>
        <p className="text-sm font-medium text-gray-700 mb-4">
          {sub.titulo}
          {sub.requerida && !preview && <span className="text-[#C0272D] ml-0.5">*</span>}
        </p>
        <EscalaSelector
          name={sub.id}
          label={sub.descripcion}
          required={sub.requerida}
          disabled={disabled}
          preview={preview}
        />
      </div>
    )
  }
  return (
    <div className="space-y-1.5">
      <label className="block text-sm font-medium text-gray-700">
        {sub.titulo}
        {!sub.requerida && <span className="text-gray-400 font-normal ml-1">(opcional)</span>}
      </label>
      <textarea
        name={sub.id}
        rows={3}
        required={sub.requerida && !preview}
        disabled={disabled}
        readOnly={preview}
        placeholder={sub.descripcion || 'Escribí tu respuesta...'}
        className={`${inputClass} resize-none`}
      />
    </div>
  )
}

// ─── Formulario completo ──────────────────────────────────────────────────────

interface FormularioDinamicoProps {
  token: string
  introduccion: string
  preguntas: Pregunta[]
  preview?: boolean
}

export default function FormularioDinamico({
  token,
  introduccion,
  preguntas,
  preview = false,
}: FormularioDinamicoProps) {
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isPending, setIsPending] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    if (preview) { e.preventDefault(); return }
    e.preventDefault()
    setIsPending(true)
    setError(null)

    const formData = new FormData(e.currentTarget)
    const body: Record<string, unknown> = { token }
    for (const [key, value] of formData.entries()) {
      if (key !== 'token') body[key] = value
    }

    try {
      const res = await fetch('/api/encuesta-dinamica', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const json = await res.json()
      if (json.error) setError(json.error)
      else setSubmitted(true)
    } catch {
      setError('Ocurrió un error. Intentá de nuevo.')
    } finally {
      setIsPending(false)
    }
  }

  if (submitted) {
    return (
      <Card className="text-center py-14">
        <img src="/CrucianelliLogo.png" alt="Crucianelli" width={180} className="mx-auto mb-8" />
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 mb-5">
          <svg className="h-8 w-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">¡Muchas gracias!</h2>
        <p className="text-gray-500 text-sm max-w-md mx-auto leading-relaxed">
          Tu respuesta fue registrada correctamente. Tu opinión nos ayuda a seguir mejorando.
        </p>
      </Card>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {!preview && <input type="hidden" name="token" value={token} />}

      {introduccion && (
        <Card>
          <p className="text-sm leading-relaxed text-gray-600">{introduccion}</p>
        </Card>
      )}

      {preguntas.map((p, i) => (
        <PreguntaBlock
          key={p.id}
          pregunta={p}
          numero={i + 1}
          disabled={isPending}
          preview={preview}
        />
      ))}

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {!preview && (
        <button
          type="submit"
          disabled={isPending}
          className="w-full h-13 rounded-xl bg-[#C0272D] text-white font-semibold text-base shadow-lg shadow-red-200 transition-all hover:bg-[#9B1E23] disabled:opacity-50 flex items-center justify-center gap-2 py-3.5"
        >
          {isPending ? 'Enviando...' : 'Enviar respuesta →'}
        </button>
      )}
    </form>
  )
}
