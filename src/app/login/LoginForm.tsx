'use client'

import { useActionState, useState } from 'react'
import { loginAction, solicitarRecuperacionAction } from './actions'

const initialState: { error?: string; success?: boolean } = {}

export default function LoginForm() {
  const [modo, setModo] = useState<'login' | 'recuperar'>('login')
  const [loginState, loginFormAction, loginPending] = useActionState(loginAction, initialState)
  const [recuperarState, recuperarFormAction, recuperarPending] = useActionState(solicitarRecuperacionAction, initialState)

  if (modo === 'recuperar') {
    if (recuperarState?.success) {
      return (
        <div className="space-y-6">
          <div className="flex flex-col items-center gap-3 rounded-xl border border-green-100 bg-green-50 px-6 py-6 text-center">
            <svg className="h-8 w-8 text-green-500" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 9v.906a2.25 2.25 0 0 1-1.183 1.981l-6.478 3.488M2.25 9v.906a2.25 2.25 0 0 0 1.183 1.981l6.478 3.488m8.839 2.51-4.66-2.51m0 0-1.023-.55a2.25 2.25 0 0 0-2.134 0l-1.022.55m0 0-4.661 2.51m16.5 1.615a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V8.844a2.25 2.25 0 0 1 1.183-1.981l7.5-4.039a2.25 2.25 0 0 1 2.134 0l7.5 4.039a2.25 2.25 0 0 1 1.183 1.98V19.5Z" />
            </svg>
            <div>
              <p className="text-sm font-semibold text-green-800">¡Listo! Revisá tu casilla</p>
              <p className="mt-1 text-xs text-green-700">
                Si el email está registrado, vas a recibir un enlace para restablecer tu contraseña.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setModo('login')}
            className="w-full text-center text-sm text-brand hover:underline"
          >
            ← Volver al inicio de sesión
          </button>
        </div>
      )
    }

    return (
      <form action={recuperarFormAction} className="space-y-5">
        <p className="text-sm text-gray-500">
          Ingresá tu email y te enviamos un enlace para restablecer la contraseña.
        </p>

        <div className="space-y-1.5">
          <label htmlFor="email-rec" className="block text-sm font-medium text-gray-700">
            Email
          </label>
          <div className="relative">
            <div className="pointer-events-none absolute inset-y-0 left-3.5 flex items-center">
              <svg className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75" />
              </svg>
            </div>
            <input
              id="email-rec"
              name="email"
              type="email"
              required
              autoComplete="email"
              disabled={recuperarPending}
              placeholder="tu@email.com"
              className="block w-full rounded-xl border border-gray-200 bg-gray-50 py-3 pl-10 pr-4 text-sm text-gray-900 placeholder-gray-400 transition-all focus:border-brand focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand/20 disabled:opacity-60"
            />
          </div>
        </div>

        {recuperarState?.error && (
          <div className="flex items-center gap-2 rounded-xl border border-red-100 bg-red-50 px-4 py-3">
            <svg className="h-4 w-4 shrink-0 text-red-500" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
            </svg>
            <p className="text-sm text-red-600">{recuperarState.error}</p>
          </div>
        )}

        <button
          type="submit"
          disabled={recuperarPending}
          className="group relative mt-2 flex w-full items-center justify-center gap-2 overflow-hidden rounded-xl bg-brand px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-brand/30 transition-all hover:bg-brand-dark hover:shadow-brand/40 disabled:opacity-70"
        >
          {recuperarPending ? (
            <>
              <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Enviando...
            </>
          ) : (
            'Enviar enlace'
          )}
        </button>

        <button
          type="button"
          onClick={() => setModo('login')}
          className="w-full text-center text-sm text-gray-400 hover:text-gray-600 hover:underline"
        >
          ← Volver al inicio de sesión
        </button>
      </form>
    )
  }

  return (
    <form action={loginFormAction} className="space-y-5">

      <div className="space-y-1.5">
        <label htmlFor="email" className="block text-sm font-medium text-gray-700">
          Email
        </label>
        <div className="relative">
          <div className="pointer-events-none absolute inset-y-0 left-3.5 flex items-center">
            <svg className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75" />
            </svg>
          </div>
          <input
            id="email"
            name="email"
            type="email"
            required
            autoComplete="email"
            disabled={loginPending}
            placeholder="tu@email.com"
            className="block w-full rounded-xl border border-gray-200 bg-gray-50 py-3 pl-10 pr-4 text-sm text-gray-900 placeholder-gray-400 transition-all focus:border-brand focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand/20 disabled:opacity-60"
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <label htmlFor="password" className="block text-sm font-medium text-gray-700">
            Contraseña
          </label>
          <button
            type="button"
            onClick={() => setModo('recuperar')}
            className="text-xs text-brand hover:underline"
          >
            ¿Olvidaste tu contraseña?
          </button>
        </div>
        <div className="relative">
          <div className="pointer-events-none absolute inset-y-0 left-3.5 flex items-center">
            <svg className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z" />
            </svg>
          </div>
          <input
            id="password"
            name="password"
            type="password"
            required
            autoComplete="current-password"
            disabled={loginPending}
            placeholder="••••••••"
            className="block w-full rounded-xl border border-gray-200 bg-gray-50 py-3 pl-10 pr-4 text-sm text-gray-900 placeholder-gray-400 transition-all focus:border-brand focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand/20 disabled:opacity-60"
          />
        </div>
      </div>

      {loginState?.error && (
        <div className="flex items-center gap-2 rounded-xl border border-red-100 bg-red-50 px-4 py-3">
          <svg className="h-4 w-4 shrink-0 text-red-500" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
          </svg>
          <p className="text-sm text-red-600">{loginState.error}</p>
        </div>
      )}

      <button
        type="submit"
        disabled={loginPending}
        className="group relative mt-2 flex w-full items-center justify-center gap-2 overflow-hidden rounded-xl bg-brand px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-brand/30 transition-all hover:bg-brand-dark hover:shadow-brand/40 disabled:opacity-70"
      >
        {loginPending ? (
          <>
            <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            Ingresando...
          </>
        ) : (
          <>
            Ingresar
            <svg className="h-4 w-4 transition-transform group-hover:translate-x-0.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
            </svg>
          </>
        )}
      </button>

    </form>
  )
}
