import { Prisma, MetodoPago } from '@prisma/client';
import prisma from '../lib/prisma';
import { obtenerRecargoCreditoPorcentaje, obtenerRecargoTransferenciaPorcentaje } from './configuracion.service';

// ── Tipos ──────────────────────────────────────────────────────────────────────

export interface ItemInput {
  productoId: number;
  cantidad: number;
}

export interface FiltrosVenta {
  fechaDesde?: Date;
  fechaHasta?: Date;
}

// ── Registrar venta (transacción completa) ─────────────────────────────────────

export async function registrarVenta(items: ItemInput[], metodoPago: MetodoPago) {
  if (!items || items.length === 0) {
    throw new Error('La venta debe contener al menos un producto');
  }

  return prisma.$transaction(async (tx) => {

    // ── Paso 1: validar stock de TODOS los items antes de procesar ─────────────

    const errores: string[] = [];
    const lineas: { productoId: number; nombre: string; cantidad: number; precioVenta: Prisma.Decimal; tieneIva: boolean; porcentajeIva: Prisma.Decimal }[] = [];

    for (const item of items) {
      if (!Number.isInteger(item.cantidad) || item.cantidad <= 0) {
        errores.push(`La cantidad para el producto ID ${item.productoId} debe ser un número entero mayor a 0`);
        continue;
      }

      const producto = await tx.producto.findFirst({
        where: { id: item.productoId, activo: true },
        select: { id: true, nombre: true, stockActual: true, precioVenta: true, tieneIva: true, porcentajeIva: true },
      });

      if (!producto) {
        errores.push(`Producto ID ${item.productoId} no encontrado o inactivo`);
        continue;
      }

      if (producto.stockActual < item.cantidad) {
        errores.push(
          `"${producto.nombre}": stock insuficiente (disponible: ${producto.stockActual}, solicitado: ${item.cantidad})`
        );
        continue;
      }

      lineas.push({
        productoId: producto.id,
        nombre: producto.nombre,
        cantidad: item.cantidad,
        precioVenta: producto.precioVenta,
        tieneIva: producto.tieneIva,
        porcentajeIva: producto.porcentajeIva,
      });
    }

    // Si hay CUALQUIER error, rechazar toda la venta
    if (errores.length > 0) {
      throw new Error(errores.join(' | '));
    }

    // ── Paso 2: calcular impuestos ─────────────────────────────────────────────

    // 2a. Subtotal sin impuestos
    const subtotalSinImpuestos = lineas.reduce(
      (acc, l) => acc + Number(l.precioVenta) * l.cantidad, 0
    );

    // 2b. IVA: solo de productos con tieneIva = true
    const impuestoIva = lineas.reduce((acc, l) => {
      if (!l.tieneIva) return acc;
      return acc + Number(l.precioVenta) * l.cantidad * (Number(l.porcentajeIva) / 100);
    }, 0);

    // 2c. Recargo por método de pago (CREDITO o TRANSFERENCIA)
    let impuestoMetodoPago = 0;
    if (metodoPago === 'CREDITO') {
      const pctCredito = await obtenerRecargoCreditoPorcentaje();
      impuestoMetodoPago = subtotalSinImpuestos * (pctCredito / 100);
    } else if (metodoPago === 'TRANSFERENCIA') {
      const pctTransferencia = await obtenerRecargoTransferenciaPorcentaje();
      impuestoMetodoPago = subtotalSinImpuestos * (pctTransferencia / 100);
    }

    // 2d. Total final
    const total = subtotalSinImpuestos + impuestoIva + impuestoMetodoPago;

    // ── Paso 3: crear registro en Venta ────────────────────────────────────────

    const venta = await tx.venta.create({
      data: {
        subtotalSinImpuestos: new Prisma.Decimal(subtotalSinImpuestos.toFixed(2)),
        impuestoIva: new Prisma.Decimal(impuestoIva.toFixed(2)),
        impuestoMetodoPago: new Prisma.Decimal(impuestoMetodoPago.toFixed(2)),
        total: new Prisma.Decimal(total.toFixed(2)),
        metodoPago,
      },
    });

    // ── Paso 4: por cada item, crear ItemVenta + descontar stock + MovimientoStock

    for (const linea of lineas) {
      const subtotal = Number(linea.precioVenta) * linea.cantidad;

      await tx.itemVenta.create({
        data: {
          ventaId: venta.id,
          productoId: linea.productoId,
          cantidad: linea.cantidad,
          precioUnitario: linea.precioVenta,   // precio congelado al momento de la venta
          subtotal: new Prisma.Decimal(subtotal),
        },
      });

      await tx.producto.update({
        where: { id: linea.productoId },
        data: { stockActual: { decrement: linea.cantidad } },
      });

      await tx.movimientoStock.create({
        data: {
          productoId: linea.productoId,
          tipo: 'SALIDA',
          cantidad: linea.cantidad,
          motivo: 'VENTA',
          referenciaId: venta.id,
        },
      });
    }

    // ── Paso 5: retornar la venta completa con sus items ──────────────────────

    return tx.venta.findUnique({
      where: { id: venta.id },
      include: {
        items: {
          include: {
            producto: {
              select: { id: true, sku: true, nombre: true, categoria: true },
            },
          },
        },
      },
    });
  });
}

// ── Listar ventas con filtro por fecha ─────────────────────────────────────────

export async function listarVentas(filtros: FiltrosVenta) {
  const where: Prisma.VentaWhereInput = {};

  if (filtros.fechaDesde || filtros.fechaHasta) {
    where.fechaHora = {
      ...(filtros.fechaDesde && { gte: filtros.fechaDesde }),
      ...(filtros.fechaHasta && { lte: filtros.fechaHasta }),
    };
  }

  return prisma.venta.findMany({
    where,
    include: {
      items: {
        include: {
          producto: {
            select: { id: true, sku: true, nombre: true, categoria: true },
          },
        },
      },
    },
    orderBy: { fechaHora: 'desc' },
  });
}

// ── Listar ventas paginadas para historial ─────────────────────────────────────

const ITEMS_POR_PAGINA = 20;

export async function listarVentasPaginadas(filtros: FiltrosVenta, pagina: number) {
  const where: Prisma.VentaWhereInput = {};

  if (filtros.fechaDesde || filtros.fechaHasta) {
    where.fechaHora = {
      ...(filtros.fechaDesde && { gte: filtros.fechaDesde }),
      ...(filtros.fechaHasta && { lte: filtros.fechaHasta }),
    };
  }

  const [total, ventas] = await Promise.all([
    prisma.venta.count({ where }),
    prisma.venta.findMany({
      where,
      include: {
        items: {
          include: {
            producto: { select: { id: true, sku: true, nombre: true, categoria: true, precioCompra: true } },
          },
        },
      },
      orderBy: { fechaHora: 'desc' },
      skip: (pagina - 1) * ITEMS_POR_PAGINA,
      take: ITEMS_POR_PAGINA,
    }),
  ]);

  return {
    ventas,
    total,
    pagina,
    porPagina: ITEMS_POR_PAGINA,
    totalPaginas: Math.ceil(total / ITEMS_POR_PAGINA),
  };
}

// ── Obtener venta por ID ───────────────────────────────────────────────────────

export async function obtenerVentaPorId(id: number) {
  return prisma.venta.findUnique({
    where: { id },
    include: {
      items: {
        include: {
          producto: {
            select: { id: true, sku: true, nombre: true, categoria: true },
          },
        },
      },
    },
  });
}
