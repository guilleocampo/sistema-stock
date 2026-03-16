import prisma from '../lib/prisma';

export interface DatosCrearProveedor {
  nombre: string;
  telefono?: string;
  email?: string;
  notas?: string;
}

export interface DatosEditarProveedor {
  nombre?: string;
  telefono?: string | null;
  email?: string | null;
  notas?: string | null;
  activo?: boolean;
}

export async function listarProveedores() {
  return prisma.proveedor.findMany({
    orderBy: [{ activo: 'desc' }, { nombre: 'asc' }],
  });
}

export async function obtenerProveedorPorId(id: number) {
  return prisma.proveedor.findFirst({
    where: { id },
    include: {
      productos: {
        where: { activo: true },
        select: {
          id: true,
          sku: true,
          nombre: true,
          categoria: true,
          precioVenta: true,
          stockActual: true,
          stockMinimo: true,
        },
        orderBy: { nombre: 'asc' },
      },
    },
  });
}

export async function nombreDuplicado(nombre: string, excluirId?: number): Promise<boolean> {
  const existente = await prisma.proveedor.findFirst({
    where: {
      nombre: { equals: nombre },
      activo: true,
      ...(excluirId ? { id: { not: excluirId } } : {}),
    },
  });
  return existente !== null;
}

export async function crearProveedor(datos: DatosCrearProveedor) {
  if (await nombreDuplicado(datos.nombre)) {
    throw new Error(`Ya existe un proveedor con el nombre "${datos.nombre}"`);
  }

  return prisma.proveedor.create({
    data: {
      nombre: datos.nombre,
      telefono: datos.telefono ?? null,
      email: datos.email ?? null,
      notas: datos.notas ?? null,
    },
  });
}

export async function editarProveedor(id: number, datos: DatosEditarProveedor) {
  const proveedor = await prisma.proveedor.findFirst({ where: { id } });
  if (!proveedor) return null;

  if (datos.nombre !== undefined && await nombreDuplicado(datos.nombre, id)) {
    throw new Error(`Ya existe un proveedor con el nombre "${datos.nombre}"`);
  }

  return prisma.proveedor.update({
    where: { id },
    data: {
      ...(datos.nombre !== undefined && { nombre: datos.nombre }),
      ...('telefono' in datos && { telefono: datos.telefono }),
      ...('email' in datos && { email: datos.email }),
      ...('notas' in datos && { notas: datos.notas }),
      ...(datos.activo !== undefined && { activo: datos.activo }),
    },
  });
}

export async function bajaLogicaProveedor(id: number) {
  const proveedor = await prisma.proveedor.findFirst({ where: { id, activo: true } });
  if (!proveedor) return null;

  return prisma.proveedor.update({
    where: { id },
    data: { activo: false },
  });
}
