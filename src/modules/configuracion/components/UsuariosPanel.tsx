'use client'

import { useActionState, useState } from 'react'
import { Card, CardContent, CardHeader } from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Badge from '@/components/ui/Badge'
import {
  crearUsuarioAction,
  actualizarRolAction,
  eliminarUsuarioAction,
} from '@/app/(dashboard)/configuracion/usuarios-actions'
import type { AppUser, UserRole } from '@/modules/configuracion/services/usuarios.service'

const ROLE_LABELS: Record<UserRole, string> = {
  admin: 'Administrador',
  rambla: 'Rambla',
  fabrica: 'Fábrica',
}

const ROLE_VARIANTS: Record<UserRole, 'info' | 'warning' | 'success'> = {
  admin: 'info',
  rambla: 'warning',
  fabrica: 'success',
}

function RoleSelect({ name, defaultValue, disabled }: { name: string; defaultValue: UserRole; disabled?: boolean }) {
  return (
    <select
      name={name}
      defaultValue={defaultValue}
      disabled={disabled}
      className="h-8 rounded-md border border-border bg-card px-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary disabled:cursor-not-allowed disabled:opacity-50"
    >
      <option value="admin">Administrador</option>
      <option value="fabrica">Fábrica</option>
      <option value="rambla">Rambla</option>
    </select>
  )
}

function UserRow({ user, currentUserId }: { user: AppUser; currentUserId: string }) {
  const [editRoleState, editRoleAction, isEditingRole] = useActionState(actualizarRolAction, {})
  const [deleteState, deleteAction, isDeleting] = useActionState(eliminarUsuarioAction, {})
  const isSelf = user.id === currentUserId

  return (
    <tr className="border-b border-border last:border-0">
      <td className="py-3 pr-4 text-sm text-foreground">
        {user.email}
        {isSelf && (
          <span className="ml-2 text-xs text-muted-foreground">(vos)</span>
        )}
      </td>
      <td className="py-3 pr-4">
        <Badge variant={ROLE_VARIANTS[user.role]}>{ROLE_LABELS[user.role]}</Badge>
      </td>
      <td className="py-3 pr-4 text-xs text-muted-foreground">
        {user.last_sign_in_at
          ? new Date(user.last_sign_in_at).toLocaleDateString('es-AR', {
              day: '2-digit',
              month: '2-digit',
              year: 'numeric',
            })
          : 'Nunca'}
      </td>
      <td className="py-3 text-right">
        {!isSelf && (
          <div className="flex items-center justify-end gap-2">
            <form action={editRoleAction} className="flex items-center gap-2">
              <input type="hidden" name="userId" value={user.id} />
              <RoleSelect name="role" defaultValue={user.role} disabled={isEditingRole} />
              <Button type="submit" size="sm" variant="outline" disabled={isEditingRole}>
                {isEditingRole ? 'Guardando…' : 'Cambiar'}
              </Button>
            </form>
            <form action={deleteAction}>
              <input type="hidden" name="userId" value={user.id} />
              <Button
                type="submit"
                size="sm"
                variant="danger"
                disabled={isDeleting}
                onClick={(e) => {
                  if (!confirm(`¿Eliminar a ${user.email}? Esta acción no se puede deshacer.`)) {
                    e.preventDefault()
                  }
                }}
              >
                {isDeleting ? 'Eliminando…' : 'Eliminar'}
              </Button>
            </form>
          </div>
        )}
        {(editRoleState.error || deleteState.error) && (
          <p className="mt-1 text-xs text-red-600">
            {editRoleState.error || deleteState.error}
          </p>
        )}
      </td>
    </tr>
  )
}

interface UsuariosPanelProps {
  users: AppUser[]
  currentUserId: string
}

export default function UsuariosPanel({ users, currentUserId }: UsuariosPanelProps) {
  const [createState, createAction, isCreating] = useActionState(crearUsuarioAction, {})
  const [showForm, setShowForm] = useState(false)

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold text-foreground">Usuarios del sistema</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Gestioná los usuarios y sus roles de acceso.
              </p>
            </div>
            <Button size="sm" onClick={() => setShowForm((v) => !v)}>
              {showForm ? 'Cancelar' : '+ Nuevo usuario'}
            </Button>
          </div>
        </CardHeader>

        {showForm && (
          <CardContent className="border-b border-border pb-6">
            <form action={createAction} className="space-y-4">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <Input
                  label="Email"
                  name="email"
                  type="email"
                  required
                  placeholder="usuario@empresa.com"
                  disabled={isCreating}
                />
                <Input
                  label="Contraseña"
                  name="password"
                  type="password"
                  required
                  placeholder="Mínimo 8 caracteres"
                  disabled={isCreating}
                />
                <div className="space-y-1">
                  <label className="block text-sm font-medium text-foreground">Rol</label>
                  <select
                    name="role"
                    defaultValue="fabrica"
                    disabled={isCreating}
                    className="h-9 w-full rounded-md border border-border bg-card px-3 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <option value="admin">Administrador</option>
                    <option value="fabrica">Fábrica</option>
                    <option value="rambla">Rambla</option>
                  </select>
                </div>
              </div>

              {createState.error && (
                <p className="text-sm text-red-600">{createState.error}</p>
              )}
              {createState.success && (
                <p className="text-sm font-medium text-green-700">
                  Usuario creado correctamente.
                </p>
              )}

              <div className="flex justify-end">
                <Button type="submit" disabled={isCreating}>
                  {isCreating ? 'Creando…' : 'Crear usuario'}
                </Button>
              </div>
            </form>
          </CardContent>
        )}

        <CardContent>
          {users.length === 0 ? (
            <p className="text-sm text-muted-foreground">No hay usuarios registrados.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    <th className="pb-2 pr-4">Email</th>
                    <th className="pb-2 pr-4">Rol</th>
                    <th className="pb-2 pr-4">Último acceso</th>
                    <th className="pb-2 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <UserRow key={user.id} user={user} currentUserId={currentUserId} />
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <h2 className="text-sm font-semibold text-foreground">Permisos por rol</h2>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div className="rounded-lg border border-border p-4">
              <Badge variant="info" className="mb-2">Administrador</Badge>
              <ul className="mt-2 space-y-1 text-xs text-muted-foreground">
                <li>✓ Dashboard, NPS, Respuestas</li>
                <li>✓ Campañas, Clientes, Llamados</li>
                <li>✓ Rambla, Configuración</li>
                <li>✓ Gestión de usuarios</li>
              </ul>
            </div>
            <div className="rounded-lg border border-border p-4">
              <Badge variant="success" className="mb-2">Fábrica</Badge>
              <ul className="mt-2 space-y-1 text-xs text-muted-foreground">
                <li>✓ Dashboard, NPS, Respuestas</li>
                <li>✗ Campañas, Clientes, Llamados</li>
                <li>✗ Rambla, Configuración</li>
              </ul>
            </div>
            <div className="rounded-lg border border-border p-4">
              <Badge variant="warning" className="mb-2">Rambla</Badge>
              <ul className="mt-2 space-y-1 text-xs text-muted-foreground">
                <li>✗ Dashboard, NPS, Respuestas</li>
                <li>✗ Campañas, Clientes, Llamados</li>
                <li>✓ Sección Rambla únicamente</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
