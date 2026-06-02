# Conceptos para aprender

Lista de conceptos que surgieron de la preparación para la reunión técnica de mayo 2026.
Este documento es para estudiarlos con calma, no para mañana.

---

## Lista de conceptos

1. JWT
2. "La validación se hace en servidor" — ¿qué significa exactamente?
3. Server Action
4. Constraint UNIQUE — qué es y cómo rechaza una inserción
5. RLS (Row Level Security)
6. Políticas (en el contexto de RLS)
7. "Bypasear" — qué significa bypasear RLS
8. Anon key sujeta a RLS
9. Guard — qué es un guard en código
10. "Impide usar service_role desde el browser" — por qué importa esto

---

## Contexto de cada uno (para cuando los estudiemos)

### 1. JWT
Aparece en: el middleware que protege el dashboard
Pregunta clave: ¿cómo sabe el servidor que el usuario ya está logueado?

### 2. Validación en servidor
Aparece en: el formulario de encuesta
Pregunta clave: ¿por qué no alcanza con validar en el browser?

### 3. Server Action
Aparece en: guardarRespuestaAction, crearCampanaAction
Pregunta clave: ¿qué diferencia hay entre un Server Action y una API?

### 4. Constraint UNIQUE
Aparece en: tabla respuestas (encuesta_id UNIQUE)
Pregunta clave: ¿qué pasa exactamente cuando dos requests intentan insertar al mismo tiempo?

### 5. RLS (Row Level Security)
Aparece en: todas las tablas de la base de datos
Pregunta clave: ¿quién decide qué puede ver cada usuario?

### 6. Políticas
Aparece en: migración 003_rls_policies.sql
Pregunta clave: ¿cómo se escribe una regla de RLS y cómo se aplica?

### 7. Bypasear (RLS)
Aparece en: createSupabaseAdmin() con service_role
Pregunta clave: ¿cuándo tiene sentido bypassear RLS y cuándo es peligroso?

### 8. Anon key sujeta a RLS
Aparece en: createSupabaseServer() con anon key
Pregunta clave: ¿qué diferencia hay entre anon key y service_role key?

### 9. Guard
Aparece en: createSupabaseAdmin() — lanza error si se llama desde el browser
Pregunta clave: ¿qué es un guard y por qué se usa en vez de simplemente no llamar esa función?

### 10. service_role desde el browser
Aparece en: src/lib/supabase/server.ts
Pregunta clave: ¿por qué es peligroso exponer service_role en el cliente aunque sea por accidente?
