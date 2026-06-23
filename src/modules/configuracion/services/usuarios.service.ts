import { createSupabaseAdmin } from '@/lib/supabase/server'

export type UserRole = 'admin' | 'rambla' | 'fabrica'

export interface AppUser {
  id: string
  email: string
  role: UserRole
  created_at: string
  last_sign_in_at: string | null
}

export async function listUsers(): Promise<AppUser[]> {
  const supabase = createSupabaseAdmin()
  const { data, error } = await supabase.auth.admin.listUsers({ perPage: 200 })
  if (error) throw error

  return data.users.map((u) => ({
    id: u.id,
    email: u.email ?? '',
    role: ((u.app_metadata?.role as string | undefined) ?? 'admin') as UserRole,
    created_at: u.created_at,
    last_sign_in_at: u.last_sign_in_at ?? null,
  }))
}

export async function createUser(email: string, password: string, role: UserRole) {
  const supabase = createSupabaseAdmin()
  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password,
    app_metadata: { role },
    email_confirm: true,
  })
  if (error) throw error
  return data.user
}

export async function updateUserRole(userId: string, role: UserRole) {
  const supabase = createSupabaseAdmin()
  const { data, error } = await supabase.auth.admin.updateUserById(userId, {
    app_metadata: { role },
  })
  if (error) throw error
  return data.user
}

export async function deleteUser(userId: string) {
  const supabase = createSupabaseAdmin()
  const { error } = await supabase.auth.admin.deleteUser(userId)
  if (error) throw error
}
