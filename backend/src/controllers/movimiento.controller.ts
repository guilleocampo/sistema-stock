import { Request, Response } from 'express';
import { TipoMovimiento, MotivoMovimiento } from '@prisma/client';
import * as movimientoService from '../services/movimiento.service';

// ── Helpers ────────────────────────────────────────────────────────────────────

function ok(res: Response, data: unknown, message = 'OK') {
  return res.json({ data, error: null, message });
}

function notFound(res: Response, message: string) {
  return res.status(404).json({ data: null, error: message, message });
}

function badRequest(res: Response, message: string) {
  return res.status(400).json({ data: null, error: message, message });
}

function serverError(res: Response, err: unknown) {
  const message = err instanceof Error ? err.message : 'Error interno del servidor';
  return res.status(500).json({ data: null, error: message, message });
}

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

export async function listar(req: Request, res: Response) {
  try {
    const { productoId, fechaDesde, fechaHasta, fecha } = req.query;

    let desde: Date | undefined;
    let hasta: Date | undefined;

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

    const movimientos = await movimientoService.listarMovimientos({
      productoId: productoId ? parseInt(String(productoId), 10) : undefined,
      fechaDesde: desde,
      fechaHasta: hasta,
    });

    return ok(res, movimientos);
  } catch (err) {
    return serverError(res, err);
  }
}

export async function listarPorProducto(req: Request, res: Response) {
  try {
    const id = parseInt(String(req.params.id), 10);
    if (isNaN(id)) return badRequest(res, 'ID inválido');

    const resultado = await movimientoService.listarMovimientosPorProducto(id);
    if (!resultado) return notFound(res, `Producto ID ${id} no encontrado`);

    return ok(res, resultado);
  } catch (err) {
    return serverError(res, err);
  }
}

export async function registrar(req: Request, res: Response) {
  try {
    const { productoId, tipo, motivo, cantidad } = req.body;

    // Validaciones de campos obligatorios
    if (!productoId || isNaN(Number(productoId))) {
      return badRequest(res, 'El productoId es obligatorio y debe ser un número');
    }
    if (!tipo) {
      return badRequest(res, `El tipo es obligatorio. Valores válidos: ENTRADA, AJUSTE`);
    }
    if (!Object.values(TipoMovimiento).includes(tipo)) {
      return badRequest(res, `Tipo inválido. Valores válidos: ${Object.values(TipoMovimiento).join(', ')}`);
    }
    if (!motivo) {
      return badRequest(res, 'El motivo es obligatorio');
    }
    if (!Object.values(MotivoMovimiento).includes(motivo)) {
      return badRequest(res, `Motivo inválido. Valores válidos: ${Object.values(MotivoMovimiento).join(', ')}`);
    }
    if (cantidad === undefined || cantidad === null || isNaN(Number(cantidad))) {
      return badRequest(res, 'La cantidad es obligatoria y debe ser un número');
    }

    const movimiento = await movimientoService.registrarMovimiento({
      productoId: Number(productoId),
      tipo: tipo as TipoMovimiento,
      motivo: motivo as MotivoMovimiento,
      cantidad: Number(cantidad),
    });

    const mensajes: Record<string, string> = {
      ENTRADA: `Entrada de stock registrada correctamente`,
      AJUSTE:  `Ajuste de stock registrado correctamente`,
    };

    return res.status(201).json({
      data: movimiento,
      error: null,
      message: mensajes[tipo] ?? 'Movimiento registrado correctamente',
    });
  } catch (err) {
    if (err instanceof Error && (
      err.message.includes('no encontrado') ||
      err.message.includes('no es válido') ||
      err.message.includes('Solo se pueden') ||
      err.message.includes('cantidad')
    )) {
      return badRequest(res, err.message);
    }
    return serverError(res, err);
  }
}
