import { Request, Response } from 'express';
import * as reporteService from '../services/reporte.service';
import type { Periodo } from '../services/reporte.service';
import { calcularRango } from '../services/reporte.service';

const PERIODOS_VALIDOS: Exclude<Periodo, 'personalizado'>[] = ['hoy', 'semana', 'mes', 'anio'];

function badRequest(res: Response, message: string) {
  return res.status(400).json({ data: null, error: message, message });
}

function serverError(res: Response, err: unknown) {
  const message = err instanceof Error ? err.message : 'Error interno del servidor';
  return res.status(500).json({ data: null, error: message, message });
}

function parsearFecha(valor: string, esInicio: boolean): Date | null {
  const fecha = new Date(valor);
  if (isNaN(fecha.getTime())) return null;
  if (esInicio) {
    fecha.setHours(0, 0, 0, 0);
  } else {
    fecha.setHours(23, 59, 59, 999);
  }
  return fecha;
}

export async function resumen(req: Request, res: Response) {
  try {
    const { periodo, desde, hasta } = req.query;

    let fechaDesde: Date;
    let fechaHasta: Date;
    let periodoLabel: Periodo | undefined;

    if (desde && hasta && typeof desde === 'string' && typeof hasta === 'string') {
      // Rango de fechas manual
      const d = parsearFecha(desde, true);
      const h = parsearFecha(hasta, false);
      if (!d) return badRequest(res, 'Formato de "desde" inválido. Use YYYY-MM-DD');
      if (!h) return badRequest(res, 'Formato de "hasta" inválido. Use YYYY-MM-DD');
      if (d > h) return badRequest(res, '"desde" no puede ser mayor que "hasta"');
      fechaDesde = d;
      fechaHasta = h;
      periodoLabel = 'personalizado';
    } else if (periodo && typeof periodo === 'string') {
      // Período predefinido
      if (!PERIODOS_VALIDOS.includes(periodo as Exclude<Periodo, 'personalizado'>)) {
        return badRequest(
          res,
          `El parámetro "periodo" debe ser uno de: ${PERIODOS_VALIDOS.join(', ')}`
        );
      }
      const rango = calcularRango(periodo as Exclude<Periodo, 'personalizado'>);
      fechaDesde = rango.desde;
      fechaHasta = rango.hasta;
      periodoLabel = periodo as Periodo;
    } else {
      return badRequest(
        res,
        'Se requiere "periodo" (hoy|semana|mes|anio) o "desde" + "hasta" (YYYY-MM-DD)'
      );
    }

    const data = await reporteService.obtenerResumen(fechaDesde, fechaHasta, periodoLabel);
    return res.json({ data, error: null, message: 'OK' });
  } catch (err) {
    return serverError(res, err);
  }
}

export async function productosSinMovimiento(req: Request, res: Response) {
  try {
    const dias = req.query.dias ? parseInt(String(req.query.dias), 10) : 30;

    if (isNaN(dias) || dias <= 0) {
      return badRequest(res, 'El parámetro "dias" debe ser un número entero mayor a 0');
    }

    const data = await reporteService.obtenerProductosSinMovimiento(dias);

    return res.json({
      data,
      error: null,
      message: `${data.length} producto(s) sin ventas en los últimos ${dias} días`,
    });
  } catch (err) {
    return serverError(res, err);
  }
}
