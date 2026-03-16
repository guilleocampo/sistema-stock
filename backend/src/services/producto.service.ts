import { Categoria, Prisma } from '@prisma/client';
import prisma from '../lib/prisma';

// ── SKU generation ─────────────────────────────────────────────────────────────

async function generarSKU(): Promise<string> {
  const ultimo = await prisma.producto.findFirst({
    where: { sku: { startsWith: 'SKU-' } },
    orderBy: { sku: 'desc' },
    select: { sku: true },
  });

  if (!ultimo) return 'SKU-0001';

  const numero = parseInt(ultimo.sku.replace('SKU-', ''), 10);
  const siguiente = numero + 1;

  if (siguiente > 9999) throw new Error('Se alcanzó el límite de SKUs (SKU-9999)');

  return `SKU-${String(siguiente).padStart(4, '0')}`;
}

// ── Tipos internos ─────────────────────────────────────────────────────────────

export interface FiltrosListar {
  categoria?: Categoria;
  busqueda?: string;
}

export interface DatosCrearProducto {
  nombre: string;
  categoria: Categoria;
  precioCompra: number;
  precioVenta: number;
  stockActual?: number;
  stockMinimo?: number;
  proveedorId?: number;
  tieneIva?: boolean;
  porcentajeIva?: number;
}

export interface DatosEditarProducto {
  nombre?: string;
  categoria?: Categoria;
  precioCompra?: number;
  precioVenta?: number;
  stockActual?: number;
  stockMinimo?: number;
  proveedorId?: number | null;
  tieneIva?: boolean;
  porcentajeIva?: number;
}

// ── Validaciones ───────────────────────────────────────────────────────────────

function validarPrecios(precioCompra: number, precioVenta: number): string | null {
  if (precioVenta <= precioCompra) {
    return 'El precio de venta debe ser mayor que el precio de compra';
  }
  return null;
}

function validarStockMinimo(stockMinimo: number): string | null {
  if (stockMinimo < 0) {
    return 'El stock mínimo no puede ser negativo';
  }
  return null;
}

// ── Servicio ───────────────────────────────────────────────────────────────────

export async function listarProductos(filtros: FiltrosListar) {
  const where: Prisma.ProductoWhereInput = { activo: true };

  if (filtros.categoria) {
    where.categoria = filtros.categoria;
  }

  if (filtros.busqueda) {
    const termino = filtros.busqueda.trim();
    where.OR = [
      { nombre: { contains: termino } },
      { sku: { contains: termino } },
    ];
  }

  return prisma.producto.findMany({
    where,
    include: { proveedor: { select: { id: true, nombre: true } } },
    orderBy: { nombre: 'asc' },
  });
}

export async function obtenerProductoPorId(id: number) {
  return prisma.producto.findFirst({
    where: { id, activo: true },
    include: { proveedor: { select: { id: true, nombre: true } } },
  });
}

export async function crearProducto(datos: DatosCrearProducto) {
  const errorPrecios = validarPrecios(datos.precioCompra, datos.precioVenta);
  if (errorPrecios) throw new Error(errorPrecios);

  if (datos.stockMinimo !== undefined) {
    const errorStock = validarStockMinimo(datos.stockMinimo);
    if (errorStock) throw new Error(errorStock);
  }

  const sku = await generarSKU();

  return prisma.producto.create({
    data: {
      sku,
      nombre: datos.nombre,
      categoria: datos.categoria,
      precioCompra: new Prisma.Decimal(datos.precioCompra),
      precioVenta: new Prisma.Decimal(datos.precioVenta),
      stockActual: datos.stockActual ?? 0,
      stockMinimo: datos.stockMinimo ?? 5,
      proveedorId: datos.proveedorId ?? null,
      tieneIva: datos.tieneIva ?? false,
      porcentajeIva: new Prisma.Decimal(datos.porcentajeIva ?? 21.0),
    },
    include: { proveedor: { select: { id: true, nombre: true } } },
  });
}

export async function editarProducto(id: number, datos: DatosEditarProducto) {
  const producto = await prisma.producto.findFirst({ where: { id, activo: true } });
  if (!producto) return null;

  const precioCompra = datos.precioCompra ?? Number(producto.precioCompra);
  const precioVenta = datos.precioVenta ?? Number(producto.precioVenta);

  const errorPrecios = validarPrecios(precioCompra, precioVenta);
  if (errorPrecios) throw new Error(errorPrecios);

  if (datos.stockMinimo !== undefined) {
    const errorStock = validarStockMinimo(datos.stockMinimo);
    if (errorStock) throw new Error(errorStock);
  }

  if (datos.stockActual !== undefined) {
    if (!Number.isInteger(datos.stockActual) || datos.stockActual < 0) {
      throw new Error('El stock actual debe ser un número entero mayor o igual a 0');
    }
  }

  return prisma.$transaction(async (tx) => {
    const updateData: Prisma.ProductoUpdateInput = {};
    if (datos.nombre !== undefined) updateData.nombre = datos.nombre;
    if (datos.categoria !== undefined) updateData.categoria = datos.categoria;
    if (datos.precioCompra !== undefined) updateData.precioCompra = new Prisma.Decimal(datos.precioCompra);
    if (datos.precioVenta !== undefined) updateData.precioVenta = new Prisma.Decimal(datos.precioVenta);
    if (datos.stockMinimo !== undefined) updateData.stockMinimo = datos.stockMinimo;
    if (datos.stockActual !== undefined) updateData.stockActual = datos.stockActual;
    if (datos.tieneIva !== undefined) updateData.tieneIva = datos.tieneIva;
    if (datos.porcentajeIva !== undefined) updateData.porcentajeIva = new Prisma.Decimal(datos.porcentajeIva);
    if ('proveedorId' in datos) {
      updateData.proveedor = datos.proveedorId
        ? { connect: { id: datos.proveedorId } }
        : { disconnect: true };
    }

    const productoActualizado = await tx.producto.update({
      where: { id },
      data: updateData,
      include: { proveedor: { select: { id: true, nombre: true } } },
    });

    // Registrar ajuste de stock en MovimientoStock
    if (datos.stockActual !== undefined) {
      const diferencia = datos.stockActual - producto.stockActual;
      await tx.movimientoStock.create({
        data: {
          productoId: id,
          tipo: 'AJUSTE',
          cantidad: Math.abs(diferencia),
          motivo: 'AJUSTE_MANUAL',
        },
      });
    }

    return productoActualizado;
  });
}

export async function bajaLogicaProducto(id: number) {
  const producto = await prisma.producto.findFirst({ where: { id, activo: true } });
  if (!producto) return null;

  return prisma.producto.update({
    where: { id },
    data: { activo: false },
  });
}

export async function listarProductosBajoStock() {
  const productos = await prisma.producto.findMany({
    where: { activo: true },
    include: { proveedor: { select: { id: true, nombre: true } } },
    orderBy: { stockActual: 'asc' },
  });

  // Prisma no soporta comparación entre columnas (stockActual <= stockMinimo)
  return productos.filter((p) => p.stockActual <= p.stockMinimo);
}
