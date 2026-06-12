'use server'

import { redirect } from 'next/navigation'
import { createSupabaseServer } from '@/lib/supabase/server'

type State = { error?: string; success?: boolean }

export async function actualizarPasswordAction(
  _prevState: State,
  formData: FormData
): Promise<State> {
  const password = (formData.get('password') as string)?.trim()
  const confirmar = (formData.get('confirmar') as string)?.trim()

  if (!password || password.length < 8) {
    return { error: 'La contraseña debe tener al menos 8 caracteres.' }
  }
  if (password !== confirmar) {
    return { error: 'Las contraseñas no coinciden.' }
  }

  const supabase = await createSupabaseServer()
  const { error } = await supabase.auth.updateUser({ password })

  if (error) {
    return { error: 'No se pudo actualizar la contraseña. El enlace puede haber expirado.' }
  }

  redirect('/login?mensaje=password_actualizado')
}
