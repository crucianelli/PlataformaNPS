import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getPlantillaById } from '@/modules/plantillas/services/plantillas.service'
import FormularioDinamico from '@/modules/plantillas/components/FormularioDinamico'
import FormularioEncuesta from '@/app/encuesta/FormularioEncuesta'

interface Props {
  params: Promise<{ id: string }>
}

export default async function PlantillaPreviewPage({ params }: Props) {
  const { id } = await params
  const plantilla = await getPlantillaById(id)
  if (!plantilla) notFound()

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Banner de vista previa */}
      <div className="sticky top-0 z-50 flex items-center justify-between gap-4 bg-amber-50 border-b border-amber-200 px-4 py-2.5">
        <div className="flex items-center gap-2 text-xs font-medium text-amber-700">
          <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
          </svg>
          Vista previa de <span className="font-semibold">{plantilla.nombre}</span> — el formulario no envía datos
        </div>
        <Link
          href={`/plantillas/${id}/editar`}
          className="inline-flex items-center gap-1.5 rounded-md bg-amber-100 border border-amber-300 px-3 py-1 text-xs font-semibold text-amber-800 hover:bg-amber-200 transition-colors"
        >
          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
          </svg>
          Volver al editor
        </Link>
      </div>

      {/* Hero rojo */}
      <div className="relative bg-[#C0272D] pt-12 pb-20 px-4 text-center">
        <div className="inline-flex items-center gap-2 rounded-full border border-white/30 bg-white/10 px-4 py-1.5 mb-6">
          <svg className="h-3.5 w-3.5 text-white" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
          </svg>
          <span className="text-white text-xs font-medium tracking-wide">Encuesta Oficial Crucianelli 2026</span>
        </div>
        <h1 className="text-white font-extrabold text-3xl md:text-4xl leading-tight mb-3">
          Contanos tu experiencia
        </h1>
        <p className="text-white/75 text-base max-w-md mx-auto leading-relaxed">
          Tu opinión es clave para mejorar el producto, la atención y la experiencia con Crucianelli.
        </p>
        <div className="absolute -bottom-px left-0 right-0 leading-none">
          <svg viewBox="0 0 1440 70" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-[71px]">
            <path d="M0,40 C200,70 400,10 600,45 C800,75 1050,15 1200,50 C1310,72 1380,45 1440,38 L1440,71 L0,71 Z" fill="white" />
          </svg>
        </div>
      </div>

      <div className="flex justify-center pt-8 pb-2">
        <img src="/CrucianelliLogo.png" alt="Crucianelli" width={240} />
      </div>

      <main className="flex-1 max-w-2xl mx-auto w-full px-4 py-6">
        {plantilla.es_sistema ? (
          <FormularioEncuesta token="preview" concesionario="" />
        ) : plantilla.preguntas.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-gray-200 py-16 text-center text-sm text-gray-400">
            Esta plantilla no tiene preguntas. Agregá preguntas desde el editor.
          </div>
        ) : (
          <FormularioDinamico
            token="preview"
            introduccion={plantilla.introduccion}
            preguntas={plantilla.preguntas}
            preview
          />
        )}
      </main>

      <footer className="text-center text-xs text-gray-400 py-6 border-t border-gray-100">
        Crucianelli © 2026 &nbsp;·&nbsp; Vista previa — los datos no se guardan
      </footer>
    </div>
  )
}
