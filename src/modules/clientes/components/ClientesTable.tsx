import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/Table'
import type { Cliente } from '../types/cliente.types'
import { formatTecnologia } from '@/lib/utils/tecnologia'

interface ClientesTableProps {
  clientes: Cliente[]
}

export default function ClientesTable({ clientes }: ClientesTableProps) {
  if (clientes.length === 0) {
    return (
      <div className="text-center py-12 text-sm text-muted-foreground">
        No hay clientes registrados.
      </div>
    )
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Nombre</TableHead>
          <TableHead>Teléfono 1</TableHead>
          <TableHead>Teléfono 2</TableHead>
          <TableHead>Teléfono 3</TableHead>
          <TableHead>Concesionario</TableHead>
          <TableHead>OF</TableHead>
          <TableHead>Tecnología</TableHead>
          <TableHead>Fecha alta</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {clientes.map((cliente) => (
          <TableRow key={cliente.id}>
            <TableCell className="font-medium">{cliente.nombre}</TableCell>
            <TableCell>{cliente.telefono}</TableCell>
            <TableCell className="text-muted-foreground">{cliente.telefono_2 ?? '—'}</TableCell>
            <TableCell className="text-muted-foreground">{cliente.telefono_3 ?? '—'}</TableCell>
            <TableCell>{cliente.concesionario}</TableCell>
            <TableCell className="text-muted-foreground">{cliente.orden_fabricacion ?? '—'}</TableCell>
            <TableCell className="text-muted-foreground">{formatTecnologia(cliente.tecnologia)}</TableCell>
            <TableCell className="text-muted-foreground">
              {new Date(cliente.created_at).toLocaleDateString('es-AR')}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
