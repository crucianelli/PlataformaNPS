import PageContainer from '@/components/layout/PageContainer'
import { Card, CardContent, CardHeader } from '@/components/ui/Card'
import ConfigForm from '@/modules/configuracion/components/ConfigForm'
import UsuariosPanel from '@/modules/configuracion/components/UsuariosPanel'
import ConfigTabs from '@/modules/configuracion/components/ConfigTabs'
import { getSystemConfig } from '@/modules/configuracion/services/configuracion.service'
import { listUsers } from '@/modules/configuracion/services/usuarios.service'
import { createSupabaseServer } from '@/lib/supabase/server'

export default async function ConfiguracionPage() {
  const [config, users, supabase] = await Promise.all([
    getSystemConfig(),
    listUsers(),
    createSupabaseServer(),
  ])

  const { data: { user } } = await supabase.auth.getUser()
  const currentUserId = user?.id ?? ''

  return (
    <PageContainer title="Configuración">
      {!config ? (
        <Card>
          <CardHeader>
            <h2 className="text-sm font-semibold text-foreground">Configuración no inicializada</h2>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              No existe una fila en <code>system_config</code>. Ejecuta el seed inicial de Supabase
              antes de continuar.
            </p>
          </CardContent>
        </Card>
      ) : (
        <ConfigTabs
          configTab={
            <div className="max-w-3xl">
              <ConfigForm config={config} />
            </div>
          }
          usuariosTab={
            <div className="max-w-4xl">
              <UsuariosPanel users={users} currentUserId={currentUserId} />
            </div>
          }
        />
      )}
    </PageContainer>
  )
}
