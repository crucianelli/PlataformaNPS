import type { Database } from '@/types/database.types'

export type PlantillaWhatsapp = Database['public']['Tables']['plantillas_whatsapp']['Row']
export type PlantillaInsert   = Database['public']['Tables']['plantillas_whatsapp']['Insert']
export type PlantillaUpdate   = Database['public']['Tables']['plantillas_whatsapp']['Update']

// Sin `script_activo`: es una columna calculada que solo viene si se la pide por
// nombre (un `select('*')` no la trae). La tiene `JobConDetalle`.
export type WhatsappJob    = Omit<Database['public']['Tables']['envios_whatsapp_jobs']['Row'], 'script_activo'>
export type WhatsappDetalle = Database['public']['Tables']['envios_whatsapp_detalle']['Row']

export type JobEstado      = WhatsappJob['estado']
export type DetalleEstado = WhatsappDetalle['estado']
export type PlantillaTipo = PlantillaWhatsapp['tipo']

export interface JobConPlantilla extends WhatsappJob {
  plantilla: Pick<PlantillaWhatsapp, 'nombre' | 'tipo'>
}

export interface JobConDetalle extends WhatsappJob {
  plantilla: Pick<PlantillaWhatsapp, 'nombre' | 'tipo'>
  detalles: WhatsappDetalle[]
  /** Hay un script con el job tomado que dio señales de vida hace menos de un minuto. */
  script_activo: boolean
}
