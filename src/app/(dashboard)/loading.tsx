/**
 * Pantalla de carga del dashboard.
 *
 * Next la muestra apenas se hace clic en un link, mientras el servidor arma la
 * página nueva. Sin este archivo la navegación espera a tener la página
 * completa y la pantalla queda congelada en la anterior. También habilita el
 * prefetch de los links del sidebar hasta este punto.
 */
export default function DashboardLoading() {
  return (
    <div
      className="mx-auto w-full max-w-screen-2xl px-4 py-4 md:px-6 md:py-6"
      role="status"
      aria-live="polite"
    >
      <span className="sr-only">Cargando…</span>

      {/* Barra fina arriba de todo, para que se note que algo está pasando */}
      <div className="fixed inset-x-0 top-0 z-50 h-0.5 animate-pulse bg-brand" aria-hidden />

      <div className="animate-pulse space-y-6" aria-hidden>
        <div className="h-7 w-48 rounded-md bg-muted" />

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-28 rounded-xl border border-border bg-card p-4">
              <div className="h-3 w-24 rounded bg-muted" />
              <div className="mt-4 h-8 w-16 rounded bg-muted" />
            </div>
          ))}
        </div>

        <div className="rounded-xl border border-border bg-card">
          <div className="border-b border-border p-4">
            <div className="h-4 w-40 rounded bg-muted" />
          </div>
          <div className="space-y-3 p-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-4 w-full rounded bg-muted" />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
