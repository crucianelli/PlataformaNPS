'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createSupabaseClient } from '@/lib/supabase/client'

export default function AuthCallbackPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const supabase = createSupabaseClient()
    const code = searchParams.get('code')
    const next = searchParams.get('next') ?? '/nueva-password'

    if (code) {
      // Flujo PKCE: intercambia el code por sesión
      supabase.auth.exchangeCodeForSession(code).then(({ error }) => {
        if (error) setError('El enlace expiró o no es válido.')
        else router.push(next)
      })
      return
    }

    // Flujo implícito: los tokens vienen en el hash (#access_token=...)
    const hash = typeof window !== 'undefined' ? window.location.hash.substring(1) : ''
    const params = new URLSearchParams(hash)
    const accessToken = params.get('access_token')
    const refreshToken = params.get('refresh_token')
    const type = params.get('type')

    if (accessToken && refreshToken && type === 'recovery') {
      supabase.auth.setSession({ access_token: accessToken, refresh_token: refreshToken })
        .then(({ error }) => {
          if (error) setError('El enlace expiró o no es válido.')
          else router.push('/nueva-password')
        })
    } else {
      setError('Enlace inválido.')
    }
  }, [router, searchParams])

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
