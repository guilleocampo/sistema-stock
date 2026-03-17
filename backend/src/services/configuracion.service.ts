import { Categoria, MetodoPago, TipoImpuesto, Prisma } from '@prisma/client';
import prisma from '../lib/prisma';

const CATEGORIAS: Categoria[] = ['QUIOSCO', 'LIBRERIA', 'REGALERIA'];

// ── Obtener configuración de ganancias (crea defaults si no existen) ────────────

export async function obtenerGanancias() {
  const configs = await Promise.all(
    CATEGORIAS.map(async (categoria) => {
      let config = await prisma.configuracionGanancia.findUnique({
        where: { categoria },
      });

      if (!config) {
        config = await prisma.configuracionGanancia.create({
          data: { categoria, porcentaje: new Prisma.Decimal(0) },
        });
      }

      const cantidadProductos = await prisma.producto.count({
        where: { categoria, activo: true },
      });

      return {
        id: config.id,
        categoria: config.categoria,
        porcentaje: Number(config.porcentaje),
        actualizadoEn: config.actualizadoEn.toISOString(),
        cantidadProductos,
      };
    })
  );

  return configs;
}

// ── Actualizar % de ganancia y recalcular precios de venta ─────────────────────

export async function actualizarGanancia(categoria: Categoria, porcentaje: number) {
  // 1. Upsert la configuración
  await prisma.configuracionGanancia.upsert({
    where: { categoria },
    update: { porcentaje: new Prisma.Decimal(porcentaje) },
    create: { categoria, porcentaje: new Prisma.Decimal(porcentaje) },
  });

  // 2. Obtener todos los productos activos de esa categoría
  const productos = await prisma.producto.findMany({
    where: { categoria, activo: true },
    select: { id: true, precioCompra: true },
  });

  // 3. Actualizar precio_venta de todos los productos de la categoría en una sola query SQL
  await prisma.$executeRaw`
    UPDATE productos
    SET precio_venta = ROUND(precio_compra + (precio_compra * ${porcentaje} / 100), 2)
    WHERE categoria = ${categoria} AND activo = 1
  `;

  // 4. Registrar todos los movimientos de una vez
  if (productos.length > 0) {
    await prisma.movimientoStock.createMany({
      data: productos.map((p) => ({
        productoId: p.id,
        tipo: 'AJUSTE' as const,
        cantidad: 0,
        motivo: 'AJUSTE_MANUAL' as const,
      })),
    });
  }

  return {
    categoria,
    porcentaje,
    productosActualizados: productos.length,
  };
}

// ── Impuestos ──────────────────────────────────────────────────────────────────

export interface DatosImpuesto {
  nombre: string;
  porcentaje: number;
  tipo: TipoImpuesto;
  metodoPago?: MetodoPago | null;
}

export async function listarImpuestos() {
  return prisma.configuracionImpuesto.findMany({
    orderBy: [{ tipo: 'asc' }, { nombre: 'asc' }],
  });
}

export async function crearImpuesto(datos: DatosImpuesto) {
  return prisma.configuracionImpuesto.create({
    data: {
      nombre: datos.nombre,
      porcentaje: new Prisma.Decimal(datos.porcentaje),
      tipo: datos.tipo,
      metodoPago: datos.metodoPago ?? null,
    },
  });
}

export async function editarImpuesto(id: number, datos: Partial<DatosImpuesto> & { activo?: boolean }) {
  const impuesto = await prisma.configuracionImpuesto.findUnique({ where: { id } });
  if (!impuesto) return null;

  return prisma.configuracionImpuesto.update({
    where: { id },
    data: {
      ...(datos.nombre !== undefined && { nombre: datos.nombre }),
      ...(datos.porcentaje !== undefined && { porcentaje: new Prisma.Decimal(datos.porcentaje) }),
      ...(datos.tipo !== undefined && { tipo: datos.tipo }),
      ...('metodoPago' in datos && { metodoPago: datos.metodoPago ?? null }),
      ...(datos.activo !== undefined && { activo: datos.activo }),
    },
  });
}

export async function bajaLogicaImpuesto(id: number) {
  const impuesto = await prisma.configuracionImpuesto.findUnique({ where: { id } });
  if (!impuesto) return null;
  return prisma.configuracionImpuesto.update({
    where: { id },
    data: { activo: false },
  });
}

// Obtiene el % de recargo para CRÉDITO (busca el primero activo de tipo POR_METODO_PAGO y CREDITO)
export async function obtenerRecargoCreditoPorcentaje(): Promise<number> {
  const config = await prisma.configuracionImpuesto.findFirst({
    where: { tipo: 'POR_METODO_PAGO', metodoPago: 'CREDITO', activo: true },
  });
  return config ? Number(config.porcentaje) : 0;
}

// Obtiene el % de recargo para TRANSFERENCIA
export async function obtenerRecargoTransferenciaPorcentaje(): Promise<number> {
  const config = await prisma.configuracionImpuesto.findFirst({
    where: { tipo: 'POR_METODO_PAGO', metodoPago: 'TRANSFERENCIA', activo: true },
  });
  return config ? Number(config.porcentaje) : 0;
}
