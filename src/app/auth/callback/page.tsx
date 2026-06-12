'use client'

import { Suspense, useEffect, useState } from 'react'
import { createSupabaseClient } from '@/lib/supabase/client'

function CallbackHandler() {
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const supabase = createSupabaseClient()

    const hash = window.location.hash.substring(1)
    const params = new URLSearchParams(hash)
    const accessToken = params.get('access_token')
    const refreshToken = params.get('refresh_token')
    const type = params.get('type')

    if (!accessToken || !refreshToken || type !== 'recovery') {
      setError('Enlace inválido.')
      return
    }

    supabase.auth.setSession({ access_token: accessToken, refresh_token: refreshToken })
      .then(({ data, error }) => {
        if (error || !data.session) {
          setError('El enlace expiró o no es válido.')
        } else {
          // Reload completo para que el middleware lea las cookies de sesión
          window.location.href = '/nueva-password'
        }
      })
  }, [])

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
