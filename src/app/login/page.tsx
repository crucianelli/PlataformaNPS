import LoginForm from './LoginForm'

export default function LoginPage() {
  return (
    <div className="flex min-h-screen">

      {/* ── Panel izquierdo: marca ── */}
      <div className="relative hidden overflow-hidden bg-gray-950 lg:flex lg:w-[52%] lg:flex-col lg:items-center lg:justify-center lg:p-16">

        {/* Círculo grande superior derecho */}
        <div
          className="pointer-events-none absolute -right-32 -top-32 h-[520px] w-[520px] rounded-full border border-white/5"
          style={{ background: 'radial-gradient(circle at 60% 40%, rgba(192,39,45,0.18) 0%, transparent 70%)' }}
        />

        {/* Círculo mediano inferior izquierdo */}
        <div
          className="pointer-events-none absolute -bottom-40 -left-24 h-[400px] w-[400px] rounded-full"
          style={{ background: 'radial-gradient(circle at 40% 60%, rgba(192,39,45,0.12) 0%, transparent 65%)' }}
        />

        {/* Líneas de campo — sugieren hileras de cultivo */}
        <svg
          className="pointer-events-none absolute inset-0 h-full w-full opacity-[0.06]"
          xmlns="http://www.w3.org/2000/svg"
          preserveAspectRatio="xMidYMid slice"
        >
          <defs>
            <pattern id="rows" x="0" y="0" width="40" height="40" patternUnits="userSpaceOnUse">
              <line x1="0" y1="40" x2="40" y2="0" stroke="white" strokeWidth="1" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#rows)" />
        </svg>

        {/* Rombo decorativo central */}
        <svg
          className="pointer-events-none absolute right-12 top-1/2 -translate-y-1/2 opacity-[0.07]"
          width="260" height="260" viewBox="0 0 260 260"
          xmlns="http://www.w3.org/2000/svg"
        >
          <polygon points="130,4 256,130 130,256 4,130" fill="none" stroke="white" strokeWidth="1.5" />
          <polygon points="130,30 230,130 130,230 30,130" fill="none" stroke="white" strokeWidth="1" />
          <polygon points="130,56 204,130 130,204 56,130" fill="none" stroke="#C0272D" strokeWidth="1.5" />
        </svg>

        {/* Puntos dispersos */}
        <svg
          className="pointer-events-none absolute inset-0 h-full w-full opacity-[0.12]"
          xmlns="http://www.w3.org/2000/svg"
        >
          {[
            [80, 120], [180, 80], [60, 300], [340, 160], [280, 340],
            [120, 420], [400, 80], [440, 260], [200, 500], [360, 460],
          ].map(([cx, cy], i) => (
            <circle key={i} cx={cx} cy={cy} r="2.5" fill="white" />
          ))}
        </svg>

        {/* Contenido principal */}
        <div className="relative z-10 flex flex-col items-center text-center">

          {/* Logo */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/Logo.jpg" alt="Crucianelli" width={100} className="mb-8 rounded-2xl shadow-2xl shadow-brand/40" />

          <h1 className="text-4xl font-bold tracking-tight text-white">
            Crucianelli
          </h1>
          <p className="mt-3 text-lg font-medium tracking-widest text-brand uppercase">
            Plataforma NPS
          </p>

          <div className="mt-10 h-px w-16 bg-white/20" />

          <p className="mt-8 max-w-xs text-sm leading-relaxed text-gray-400">
            Sistema centralizado de gestión de encuestas de satisfacción y seguimiento de clientes.
          </p>
        </div>

        {/* Línea de acento inferior */}
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-brand to-transparent opacity-60" />
      </div>

      {/* ── Panel derecho: formulario ── */}
      <div
        className="relative flex flex-1 flex-col items-center justify-center overflow-hidden px-8 py-12"
        style={{ background: 'radial-gradient(ellipse at 70% 30%, #f1f5f9 0%, #f8fafc 60%, #ffffff 100%)' }}
      >

        {/* Círculo decorativo fondo */}
        <div className="pointer-events-none absolute -bottom-24 -right-24 h-72 w-72 rounded-full bg-gray-100/80" />
        <div className="pointer-events-none absolute -top-16 -left-16 h-48 w-48 rounded-full bg-gray-100/60" />

        {/* Logo visible solo en mobile */}
        <div className="mb-10 flex flex-col items-center lg:hidden">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/Logo.jpg" alt="Crucianelli" width={56} className="mb-4 rounded-xl shadow-lg" />
          <p className="text-xs font-semibold uppercase tracking-widest text-brand">Plataforma NPS</p>
        </div>

        {/* Card */}
        <div className="relative z-10 w-full max-w-sm rounded-2xl border border-gray-200/80 bg-white shadow-2xl shadow-gray-200/60">

          {/* Barra roja superior */}
          <div className="h-1.5 w-full rounded-t-2xl bg-gradient-to-r from-brand via-red-400 to-brand" />

          <div className="px-8 py-10">

            {/* Encabezado */}
            <div className="mb-8">
              <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-brand/10">
                <svg className="h-5 w-5 text-brand" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold tracking-tight text-gray-900">Bienvenido</h2>
              <p className="mt-1.5 text-sm text-gray-500">
                Ingresá con tu cuenta para continuar
              </p>
            </div>

            <LoginForm />

            {/* Separador */}
            <div className="mt-8 flex items-center gap-3">
              <div className="h-px flex-1 bg-gray-100" />
              <span className="text-xs text-gray-400">Crucianelli &copy; {new Date().getFullYear()}</span>
              <div className="h-px flex-1 bg-gray-100" />
            </div>

          </div>
        </div>

        <p className="relative z-10 mt-6 text-center text-xs text-gray-400">
          Acceso restringido a personal autorizado
        </p>
      </div>

    </div>
  )
}
