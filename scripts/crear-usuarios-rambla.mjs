import { createClient } from '@supabase/supabase-js'
import { randomBytes } from 'crypto'
import { readFileSync } from 'fs'
import { resolve } from 'path'

// Leer .env.local manualmente
const envPath = resolve(process.cwd(), '.env.local')
const env = Object.fromEntries(
  readFileSync(envPath, 'utf-8')
    .split('\n')
    .filter(l => l && !l.startsWith('#'))
    .map(l => l.split('=').map(p => p.trim()))
    .filter(([k]) => k)
)

const SUPABASE_URL = env.NEXT_PUBLIC_SUPABASE_URL
const SERVICE_ROLE_KEY = env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error('Faltan NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY en .env.local')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
})

function generarPassword() {
  return randomBytes(12).toString('base64url').slice(0, 14)
}

const usuarios = [
  'florencia.pagni@rambla.la',
  'sergio.ayala@rambla.la',
  'sol.capdevila@rambla.la',
  'johana.arreseygor@rambla.la',
]

console.log('\nCreando usuarios Rambla...\n')

const resultados = []

for (const email of usuarios) {
  const password = generarPassword()

  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    app_metadata: { role: 'rambla' },
  })

  if (error) {
    resultados.push({ email, password: '—', estado: `ERROR: ${error.message}` })
  } else {
    resultados.push({ email, password, estado: 'OK', id: data.user.id })
  }
}

console.log('─'.repeat(72))
console.log('Email'.padEnd(36), 'Contraseña'.padEnd(18), 'Estado')
console.log('─'.repeat(72))
for (const r of resultados) {
  console.log(r.email.padEnd(36), r.password.padEnd(18), r.estado)
}
console.log('─'.repeat(72))
console.log('\nGuardá estas contraseñas — no se pueden recuperar luego.\n')
