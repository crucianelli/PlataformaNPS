'use client'

import { Suspense, useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { createSupabaseClient } from '@/lib/supabase/client'

function CallbackHandler() {
  const searchParams = useSearchParams()
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const supabase = createSupabaseClient()
    const next = searchParams.get('next') ?? '/nueva-password'

    // onAuthStateChange detecta automáticamente el token del hash (flujo implícito)
    // y dispara PASSWORD_RECOVERY cuando el token es válido
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY' && session) {
        // Reload completo para que el middleware lea las cookies de sesión correctamente
        window.location.href = next
      } else if (event === 'SIGNED_IN' && session) {
        window.location.href = next
      }
    })

    // Timeout de seguridad: si en 8 segundos no se detectó nada, el enlace expiró
    const timeout = setTimeout(() => {
      Promise.resolve().then(() => setError('El enlace expiró o no es válido.'))
    }, 8000)

    return () => {
      subscription.unsubscribe()
      clearTimeout(timeout)
    }
  }, [searchParams])

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
        <div className="w-full max-w-sm rounded-2xl border border-red-100 bg-white p-8 text-center shadow-lg">
          <p className="mb-4 text-sm font-medium text-red-600">{error}</p>
          <a href="/login" className="text-sm text-brand hover:underline">
            ← Volver al inicio de sesión
          </a>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <div className="flex items-center gap-3 text-sm text-gray-500">
        <svg className="h-4 w-4 animate-spin text-brand" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
        Verificando enlace...
      </div>
    </div>
  )
}

export default function AuthCallbackPage() {
  return (
    <Suspense>
      <CallbackHandler />
    </Suspense>
  )
}
