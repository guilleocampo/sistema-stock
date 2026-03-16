import { Request, Response } from 'express';
import { MetodoPago } from '@prisma/client';
import * as ventaService from '../services/venta.service';

const METODOS_PAGO_VALIDOS = Object.values(MetodoPago);

// ── Helpers ────────────────────────────────────────────────────────────────────

function ok(res: Response, data: unknown, message = 'OK') {
  return res.json({ data, error: null, message });
}

function notFound(res: Response, message = 'Venta no encontrada') {
  return res.status(404).json({ data: null, error: message, message });
}

function badRequest(res: Response, message: string) {
  return res.status(400).json({ data: null, error: message, message });
}

function serverError(res: Response, err: unknown) {
  const message = err instanceof Error ? err.message : 'Error interno del servidor';
  return res.status(500).json({ data: null, error: message, message });
}

// ── Parsear fecha desde string, ajustando al inicio/fin del día ────────────────

function parsearFechaInicio(valor: string): Date | null {
  const fecha = new Date(valor);
  if (isNaN(fecha.getTime())) return null;
  fecha.setHours(0, 0, 0, 0);
  return fecha;
}

function parsearFechaFin(valor: string): Date | null {
  const fecha = new Date(valor);
  if (isNaN(fecha.getTime())) return null;
  fecha.setHours(23, 59, 59, 999);
  return fecha;
}

// ── Controladores ──────────────────────────────────────────────────────────────

export async function crear(req: Request, res: Response) {
  try {
    const { items, metodoPago } = req.body;

    if (!Array.isArray(items) || items.length === 0) {
      return badRequest(res, 'Se requiere un array "items" con al menos un producto');
    }

    for (const item of items) {
      if (typeof item.productoId !== 'number' || typeof item.cantidad !== 'number') {
        return badRequest(res, 'Cada item debe tener "productoId" (número) y "cantidad" (número)');
      }
    }

    if (!metodoPago || !METODOS_PAGO_VALIDOS.includes(metodoPago)) {
      return badRequest(res, `Se requiere "metodoPago". Valores válidos: ${METODOS_PAGO_VALIDOS.join(', ')}`);
    }

    const venta = await ventaService.registrarVenta(items, metodoPago);

    return res.status(201).json({
      data: venta,
      error: null,
      message: `Venta registrada correctamente. Total: $${venta?.total}`,
    });
  } catch (err) {
    // Errores de stock o validación — son errores de negocio, no 500
    if (err instanceof Error && (
      err.message.includes('stock insuficiente') ||
      err.message.includes('no encontrado') ||
      err.message.includes('al menos un producto') ||
      err.message.includes('cantidad')
    )) {
      return badRequest(res, err.message);
    }
    return serverError(res, err);
  }
}

export async function listar(req: Request, res: Response) {
  try {
    const { fechaDesde, fechaHasta, fecha } = req.query;

    let desde: Date | undefined;
    let hasta: Date | undefined;

    // ?fecha=2024-03-15 → filtra solo ese día
    if (fecha && typeof fecha === 'string') {
      const d = parsearFechaInicio(fecha);
      const h = parsearFechaFin(fecha);
      if (!d || !h) return badRequest(res, 'Formato de fecha inválido. Use YYYY-MM-DD');
      desde = d;
      hasta = h;
    } else {
      if (fechaDesde && typeof fechaDesde === 'string') {
        const d = parsearFechaInicio(fechaDesde);
        if (!d) return badRequest(res, 'Formato de fechaDesde inválido. Use YYYY-MM-DD');
        desde = d;
      }
      if (fechaHasta && typeof fechaHasta === 'string') {
        const h = parsearFechaFin(fechaHasta);
        if (!h) return badRequest(res, 'Formato de fechaHasta inválido. Use YYYY-MM-DD');
        hasta = h;
      }
    }

    const ventas = await ventaService.listarVentas({ fechaDesde: desde, fechaHasta: hasta });
    return ok(res, ventas);
  } catch (err) {
    return serverError(res, err);
  }
}

export async function historial(req: Request, res: Response) {
  try {
    const { desde, hasta, pagina } = req.query;

    let fechaDesde: Date | undefined;
    let fechaHasta: Date | undefined;

    if (desde && typeof desde === 'string') {
      const d = parsearFechaInicio(desde);
      if (!d) return badRequest(res, 'Formato de "desde" inválido. Use YYYY-MM-DD');
      fechaDesde = d;
    }
    if (hasta && typeof hasta === 'string') {
      const h = parsearFechaFin(hasta);
      if (!h) return badRequest(res, 'Formato de "hasta" inválido. Use YYYY-MM-DD');
      fechaHasta = h;
    }

    const paginaNum = pagina ? parseInt(String(pagina), 10) : 1;
    if (isNaN(paginaNum) || paginaNum < 1) {
      return badRequest(res, 'El parámetro "pagina" debe ser un número entero mayor a 0');
    }

    const resultado = await ventaService.listarVentasPaginadas(
      { fechaDesde, fechaHasta },
      paginaNum
    );
    return ok(res, resultado);
  } catch (err) {
    return serverError(res, err);
  }
}

export async function obtenerPorId(req: Request, res: Response) {
  try {
    const id = parseInt(String(req.params.id), 10);
    if (isNaN(id)) return badRequest(res, 'ID inválido');

    const venta = await ventaService.obtenerVentaPorId(id);
    if (!venta) return notFound(res);

    return ok(res, venta);
  } catch (err) {
    return serverError(res, err);
  }
}
