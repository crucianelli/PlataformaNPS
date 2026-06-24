import type { Database } from '@/types/database.types'

export type PlantillaWhatsapp = Database['public']['Tables']['plantillas_whatsapp']['Row']
export type PlantillaInsert   = Database['public']['Tables']['plantillas_whatsapp']['Insert']
export type PlantillaUpdate   = Database['public']['Tables']['plantillas_whatsapp']['Update']

export type WhatsappJob    = Database['public']['Tables']['envios_whatsapp_jobs']['Row']
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
}
