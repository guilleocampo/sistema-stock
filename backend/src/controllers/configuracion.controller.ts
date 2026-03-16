import { Request, Response } from 'express';
import { Categoria } from '@prisma/client';
import * as configuracionService from '../services/configuracion.service';

const CATEGORIAS_VALIDAS: Categoria[] = ['QUIOSCO', 'LIBRERIA', 'REGALERIA'];

function ok(res: Response, data: unknown, message = 'OK') {
  return res.json({ data, error: null, message });
}

function badRequest(res: Response, message: string) {
  return res.status(400).json({ data: null, error: message, message });
}

function serverError(res: Response, err: unknown) {
  const message = err instanceof Error ? err.message : 'Error interno del servidor';
  return res.status(500).json({ data: null, error: message, message });
}

export async function obtenerGanancias(_req: Request, res: Response) {
  try {
    const data = await configuracionService.obtenerGanancias();
    return ok(res, data);
  } catch (err) {
    return serverError(res, err);
  }
}

export async function actualizarGanancia(req: Request, res: Response) {
  try {
    const { categoria, porcentaje } = req.body;

    if (!categoria || !CATEGORIAS_VALIDAS.includes(categoria as Categoria)) {
      return badRequest(res, `"categoria" debe ser uno de: ${CATEGORIAS_VALIDAS.join(', ')}`);
    }

    const pct = Number(porcentaje);
    if (porcentaje === undefined || porcentaje === null || isNaN(pct) || pct < 0) {
      return badRequest(res, '"porcentaje" debe ser un número mayor o igual a 0');
    }

    const data = await configuracionService.actualizarGanancia(categoria as Categoria, pct);
    return ok(
      res,
      data,
      `Precios actualizados para ${data.productosActualizados} producto(s) de ${categoria}`
    );
  } catch (err) {
    return serverError(res, err);
  }
}
