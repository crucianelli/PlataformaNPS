'use server'

import { createSupabaseServer, createSupabaseAdmin } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { headers } from 'next/headers'
import { sendEmail } from '@/lib/email/send-email'
import { buildRecuperarPasswordTemplate } from '@/lib/email/templates/recuperar-password'

type LoginState = { error?: string }

export async function loginAction(
  _prevState: LoginState,
  formData: FormData
): Promise<LoginState> {
  const email = formData.get('email') as string
  const password = formData.get('password') as string

  const supabase = await createSupabaseServer()
  const { error } = await supabase.auth.signInWithPassword({ email, password })

  if (error) {
    return { error: 'Credenciales incorrectas. Verificá tu email y contraseña.' }
  }

  redirect('/')
}

type RecuperarState = { error?: string; success?: boolean }

export async function solicitarRecuperacionAction(
  _prevState: RecuperarState,
  formData: FormData
): Promise<RecuperarState> {
  const email = (formData.get('email') as string)?.trim().toLowerCase()

  if (!email) return { error: 'Ingresá tu email.' }

  const headersList = await headers()
  const host = headersList.get('host') ?? 'localhost:3000'
  const proto = headersList.get('x-forwarded-proto') ?? (host.startsWith('localhost') ? 'http' : 'https')
  const redirectTo = `${proto}://${host}/auth/callback?next=/nueva-password`

  const admin = createSupabaseAdmin()
  const { data, error } = await admin.auth.admin.generateLink({
    type: 'recovery',
    email,
    options: { redirectTo },
  })

  if (error) {
    console.error('[recuperar-password] generateLink error:', error.message)
    return { success: true }
  }

  if (!data?.properties?.action_link) {
    console.error('[recuperar-password] generateLink: no action_link en la respuesta', data)
    return { success: true }
  }

  const template = buildRecuperarPasswordTemplate(data.properties.action_link)

  try {
    await sendEmail({ to: email, ...template })
    console.log('[recuperar-password] email enviado a', email)
  } catch (err) {
    console.error('[recuperar-password] sendEmail error:', err)
  }

  return { success: true }
}
