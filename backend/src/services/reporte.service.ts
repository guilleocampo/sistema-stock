import { Categoria, MetodoPago } from '@prisma/client';
import prisma from '../lib/prisma';

// ── Cálculo de rango de fechas según período ───────────────────────────────────

export type Periodo = 'hoy' | 'semana' | 'mes' | 'anio' | 'personalizado';

export function calcularRango(periodo: Exclude<Periodo, 'personalizado'>): { desde: Date; hasta: Date } {
  const hasta = new Date();
  hasta.setHours(23, 59, 59, 999);

  const desde = new Date();
  desde.setHours(0, 0, 0, 0);

  if (periodo === 'semana') {
    // Lunes de la semana actual
    const diaSemana = desde.getDay(); // 0=Dom, 1=Lun...
    const diasDesdeElLunes = diaSemana === 0 ? 6 : diaSemana - 1;
    desde.setDate(desde.getDate() - diasDesdeElLunes);
  } else if (periodo === 'mes') {
    desde.setDate(1);
  } else if (periodo === 'anio') {
    desde.setMonth(0, 1);
  }
  // 'hoy' ya está configurado con setHours(0,0,0,0)

  return { desde, hasta };
}

// ── Resumen del período ────────────────────────────────────────────────────────

export async function obtenerResumen(desde: Date, hasta: Date, periodo?: Periodo) {
  const filtroFecha = { gte: desde, lte: hasta };
  const periodoLabel: Periodo = periodo ?? 'personalizado';

  // ── 1. Totales generales ───────────────────────────────────────────────────

  const [agregado, cantidadVentas] = await Promise.all([
    prisma.venta.aggregate({
      where: { fechaHora: filtroFecha },
      _sum: { total: true },
    }),
    prisma.venta.count({
      where: { fechaHora: filtroFecha },
    }),
  ]);

  const totalRecaudado = Number(agregado._sum.total ?? 0);
  const ticketPromedio = cantidadVentas > 0 ? totalRecaudado / cantidadVentas : 0;

  // ── 2. Top 5 productos más vendidos ───────────────────────────────────────

  const topProductosRaw = await prisma.itemVenta.groupBy({
    by: ['productoId'],
    where: { venta: { fechaHora: filtroFecha } },
    _sum: { cantidad: true, subtotal: true },
    orderBy: { _sum: { cantidad: 'desc' } },
    take: 5,
  });

  // Enriquecer con info del producto
  const topProductos = await Promise.all(
    topProductosRaw.map(async (item) => {
      const producto = await prisma.producto.findUnique({
        where: { id: item.productoId },
        select: { id: true, sku: true, nombre: true, categoria: true },
      });
      return {
        producto,
        unidadesVendidas: item._sum.cantidad ?? 0,
        montoTotal: Number(item._sum.subtotal ?? 0),
      };
    })
  );

  // ── 3. Desglose por categoría ──────────────────────────────────────────────

  const itemsDelPeriodo = await prisma.itemVenta.findMany({
    where: { venta: { fechaHora: filtroFecha } },
    select: {
      cantidad: true,
      subtotal: true,
      precioUnitario: true,
      producto: { select: { categoria: true, precioCompra: true } },
    },
  });

  const gananciaTotal = itemsDelPeriodo.reduce((acc, item) => {
    const ganancia = (Number(item.precioUnitario) - Number(item.producto.precioCompra)) * item.cantidad;
    return acc + ganancia;
  }, 0);

  const desgloseCategoria = Object.values(Categoria).map((cat) => {
    const itemsCat = itemsDelPeriodo.filter((i) => i.producto.categoria === cat);
    return {
      categoria: cat,
      unidadesVendidas: itemsCat.reduce((acc, i) => acc + i.cantidad, 0),
      montoTotal: itemsCat.reduce((acc, i) => acc + Number(i.subtotal), 0),
      cantidadTransacciones: new Set(
        // aproximado: contar productos únicos vendidos por categoría
        itemsCat.map((i) => i.cantidad)
      ).size,
    };
  });

  // ── 4. Desglose por método de pago ────────────────────────────────────────

  const ventasDelPeriodo = await prisma.venta.findMany({
    where: { fechaHora: filtroFecha },
    select: { total: true, metodoPago: true, subtotalSinImpuestos: true, impuestoIva: true, impuestoMetodoPago: true },
  });

  const desgloseMetodoPago = Object.values(MetodoPago).map((metodo) => {
    const ventasMetodo = ventasDelPeriodo.filter((v) => v.metodoPago === metodo);
    return {
      metodoPago: metodo,
      cantidadTransacciones: ventasMetodo.length,
      montoTotal: Number(ventasMetodo.reduce((acc, v) => acc + Number(v.total), 0).toFixed(2)),
    };
  });

  // ── 5. Impuestos del período ────────────────────────────────────────────────

  const totalIva = Number(
    ventasDelPeriodo.reduce((acc, v) => acc + Number(v.impuestoIva), 0).toFixed(2)
  );
  const totalRecargosMetodoPago = Number(
    ventasDelPeriodo.reduce((acc, v) => acc + Number(v.impuestoMetodoPago), 0).toFixed(2)
  );
  const totalSinImpuestos = Number(
    ventasDelPeriodo.reduce((acc, v) => acc + Number(v.subtotalSinImpuestos), 0).toFixed(2)
  );

  return {
    periodo: periodoLabel,
    desde: desde.toISOString(),
    hasta: hasta.toISOString(),
    totalRecaudado: Number(totalRecaudado.toFixed(2)),
    cantidadVentas,
    ticketPromedio: Number(ticketPromedio.toFixed(2)),
    gananciaTotal: Number(gananciaTotal.toFixed(2)),
    topProductos,
    desgloseCategoria,
    desgloseMetodoPago,
    totalIva,
    totalRecargosMetodoPago,
    totalSinImpuestos,
  };
}

// ── Productos sin movimiento en los últimos X días ─────────────────────────────

export async function obtenerProductosSinMovimiento(dias: number) {
  const fechaLimite = new Date();
  fechaLimite.setDate(fechaLimite.getDate() - dias);
  fechaLimite.setHours(0, 0, 0, 0);

  // IDs de productos que SÍ tuvieron ventas en el período
  const conVentaReciente = await prisma.itemVenta.groupBy({
    by: ['productoId'],
    where: { venta: { fechaHora: { gte: fechaLimite } } },
  });

  const idsConVenta = conVentaReciente.map((i) => i.productoId);

  // Productos activos que NO están en esa lista
  const productosSinVenta = await prisma.producto.findMany({
    where: {
      activo: true,
      id: { notIn: idsConVenta.length > 0 ? idsConVenta : [-1] },
    },
    select: {
      id: true,
      sku: true,
      nombre: true,
      categoria: true,
      stockActual: true,
      stockMinimo: true,
      proveedor: { select: { id: true, nombre: true } },
    },
    orderBy: { nombre: 'asc' },
  });

  // Para cada uno, buscar cuándo fue su última venta
  const hoy = new Date();

  const resultado = await Promise.all(
    productosSinVenta.map(async (producto) => {
      const ultimaVenta = await prisma.itemVenta.findFirst({
        where: { productoId: producto.id },
        orderBy: { venta: { fechaHora: 'desc' } },
        select: { venta: { select: { fechaHora: true } } },
      });

      const diasSinVenta = ultimaVenta
        ? Math.floor((hoy.getTime() - ultimaVenta.venta.fechaHora.getTime()) / (1000 * 60 * 60 * 24))
        : null; // null = nunca se vendió

      return {
        ...producto,
        ultimaVenta: ultimaVenta?.venta.fechaHora ?? null,
        diasSinVenta,
      };
    })
  );

  // Ordenar: los nunca vendidos al final, luego por más días sin venta
  return resultado.sort((a, b) => {
    if (a.diasSinVenta === null && b.diasSinVenta === null) return 0;
    if (a.diasSinVenta === null) return 1;
    if (b.diasSinVenta === null) return -1;
    return b.diasSinVenta - a.diasSinVenta;
  });
}
