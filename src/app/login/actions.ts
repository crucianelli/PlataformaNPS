'use server'

import { createSupabaseServer } from '@/lib/supabase/server'
import { createSupabaseAdmin } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
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

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
  const redirectTo = `${appUrl}/auth/callback?next=/nueva-password`

  const admin = createSupabaseAdmin()
  const { data, error } = await admin.auth.admin.generateLink({
    type: 'recovery',
    email,
    options: { redirectTo },
  })

  // Siempre responder con éxito para no revelar si el email existe
  if (error || !data?.properties?.action_link) {
    return { success: true }
  }

  const template = buildRecuperarPasswordTemplate(data.properties.action_link)

  try {
    await sendEmail({ to: email, ...template })
  } catch {
    // No bloquear al usuario si el email falla
  }

  return { success: true }
}
