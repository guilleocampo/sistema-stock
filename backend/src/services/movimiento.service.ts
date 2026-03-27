import { Prisma, TipoMovimiento, MotivoMovimiento } from '@prisma/client';
import prisma from '../lib/prisma';

// ── Tipos ──────────────────────────────────────────────────────────────────────

export interface DatosRegistrarMovimiento {
  productoId: number;
  tipo: TipoMovimiento;
  motivo: MotivoMovimiento;
  cantidad: number;  // Para ENTRADA: unidades a agregar. Para AJUSTE: nuevo stock absoluto.
}

export interface FiltrosMovimiento {
  productoId?: number;
  fechaDesde?: Date;
  fechaHasta?: Date;
}

// ── Motivos permitidos por tipo ────────────────────────────────────────────────

const MOTIVOS_PERMITIDOS: Record<string, MotivoMovimiento[]> = {
  ENTRADA: ['COMPRA', 'DEVOLUCION'],
  AJUSTE:  ['AJUSTE_MANUAL'],
};

// ── Registrar movimiento (transacción) ─────────────────────────────────────────

export async function registrarMovimiento(datos: DatosRegistrarMovimiento) {
  // Validar que el tipo sea ENTRADA o AJUSTE (SALIDA la maneja el módulo de ventas)
  if (!['ENTRADA', 'AJUSTE'].includes(datos.tipo)) {
    throw new Error('Solo se pueden registrar movimientos de tipo ENTRADA o AJUSTE. Las salidas se registran automáticamente al crear una venta');
  }

  const motivosValidos = MOTIVOS_PERMITIDOS[datos.tipo];
  if (!motivosValidos.includes(datos.motivo)) {
    throw new Error(
      `El motivo "${datos.motivo}" no es válido para tipo ${datos.tipo}. Motivos permitidos: ${motivosValidos.join(', ')}`
    );
  }

  if (datos.tipo === 'ENTRADA' && (!Number.isInteger(datos.cantidad) || datos.cantidad <= 0)) {
    throw new Error('Para ENTRADA, la cantidad debe ser un número entero mayor a 0');
  }

  if (datos.tipo === 'AJUSTE' && (!Number.isInteger(datos.cantidad) || datos.cantidad < 0)) {
    throw new Error('Para AJUSTE, la cantidad es el nuevo stock total y debe ser mayor o igual a 0');
  }

  return prisma.$transaction(async (tx) => {
    const producto = await tx.producto.findFirst({
      where: { id: datos.productoId, activo: true },
      select: { id: true, nombre: true, stockActual: true },
    });

    if (!producto) {
      throw new Error(`Producto ID ${datos.productoId} no encontrado o inactivo`);
    }

    let nuevoStock: number;
    let cantidadMovimiento: number;

    if (datos.tipo === 'ENTRADA') {
      // Sumar unidades al stock existente
      nuevoStock = producto.stockActual + datos.cantidad;
      cantidadMovimiento = datos.cantidad;
    } else {
      // AJUSTE: datos.cantidad es el nuevo stock absoluto
      nuevoStock = datos.cantidad;
      cantidadMovimiento = Math.abs(datos.cantidad - producto.stockActual);
    }

    await tx.producto.update({
      where: { id: datos.productoId },
      data: { stockActual: nuevoStock },
    });

    const fechaArgentina = new Date(Date.now() - 3 * 60 * 60 * 1000);

    return tx.movimientoStock.create({
      data: {
        productoId: datos.productoId,
        tipo: datos.tipo,
        cantidad: cantidadMovimiento,
        motivo: datos.motivo,
        fechaHora: fechaArgentina,
      },
      include: {
        producto: { select: { id: true, sku: true, nombre: true, stockActual: true } },
      },
    });
  });
}

// ── Historial completo con filtros ─────────────────────────────────────────────

export async function listarMovimientos(filtros: FiltrosMovimiento) {
  const where: Prisma.MovimientoStockWhereInput = {};

  if (filtros.productoId) {
    where.productoId = filtros.productoId;
  }

  if (filtros.fechaDesde || filtros.fechaHasta) {
    where.fechaHora = {
      ...(filtros.fechaDesde && { gte: filtros.fechaDesde }),
      ...(filtros.fechaHasta && { lte: filtros.fechaHasta }),
    };
  }

  return prisma.movimientoStock.findMany({
    where,
    include: {
      producto: { select: { id: true, sku: true, nombre: true, categoria: true } },
    },
    orderBy: { fechaHora: 'desc' },
  });
}

// ── Historial de un producto específico ───────────────────────────────────────

export async function listarMovimientosPorProducto(productoId: number) {
  const producto = await prisma.producto.findFirst({
    where: { id: productoId },
    select: { id: true, sku: true, nombre: true, stockActual: true, stockMinimo: true },
  });

  if (!producto) return null;

  const movimientos = await prisma.movimientoStock.findMany({
    where: { productoId },
    orderBy: { fechaHora: 'desc' },
  });

  return { producto, movimientos };
}
