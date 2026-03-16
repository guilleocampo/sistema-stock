import { Request, Response } from 'express';
import { Categoria, TipoImpuesto, MetodoPago } from '@prisma/client';
import * as configuracionService from '../services/configuracion.service';

const TIPOS_IMPUESTO_VALIDOS = Object.values(TipoImpuesto);
const METODOS_PAGO_VALIDOS = Object.values(MetodoPago);

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

// ── Impuestos ──────────────────────────────────────────────────────────────────

export async function listarImpuestos(_req: Request, res: Response) {
  try {
    const data = await configuracionService.listarImpuestos();
    return ok(res, data);
  } catch (err) {
    return serverError(res, err);
  }
}

export async function crearImpuesto(req: Request, res: Response) {
  try {
    const { nombre, porcentaje, tipo, metodoPago } = req.body;

    if (!nombre || typeof nombre !== 'string' || nombre.trim() === '') {
      return badRequest(res, '"nombre" es obligatorio');
    }
    if (porcentaje === undefined || isNaN(Number(porcentaje)) || Number(porcentaje) < 0 || Number(porcentaje) > 100) {
      return badRequest(res, '"porcentaje" debe ser un número entre 0 y 100');
    }
    if (!tipo || !TIPOS_IMPUESTO_VALIDOS.includes(tipo as TipoImpuesto)) {
      return badRequest(res, `"tipo" debe ser uno de: ${TIPOS_IMPUESTO_VALIDOS.join(', ')}`);
    }
    if (metodoPago !== undefined && metodoPago !== null && !METODOS_PAGO_VALIDOS.includes(metodoPago as MetodoPago)) {
      return badRequest(res, `"metodoPago" debe ser uno de: ${METODOS_PAGO_VALIDOS.join(', ')}`);
    }

    const data = await configuracionService.crearImpuesto({
      nombre: nombre.trim(),
      porcentaje: Number(porcentaje),
      tipo: tipo as TipoImpuesto,
      metodoPago: metodoPago ? (metodoPago as MetodoPago) : null,
    });
    return res.status(201).json({ data, error: null, message: 'Impuesto creado correctamente' });
  } catch (err) {
    return serverError(res, err);
  }
}

export async function editarImpuesto(req: Request, res: Response) {
  try {
    const id = parseInt(String(req.params.id), 10);
    if (isNaN(id)) return badRequest(res, 'ID inválido');

    const { nombre, porcentaje, tipo, metodoPago, activo } = req.body;

    if (porcentaje !== undefined && (isNaN(Number(porcentaje)) || Number(porcentaje) < 0 || Number(porcentaje) > 100)) {
      return badRequest(res, '"porcentaje" debe ser un número entre 0 y 100');
    }
    if (tipo !== undefined && !TIPOS_IMPUESTO_VALIDOS.includes(tipo as TipoImpuesto)) {
      return badRequest(res, `"tipo" debe ser uno de: ${TIPOS_IMPUESTO_VALIDOS.join(', ')}`);
    }
    if (metodoPago !== undefined && metodoPago !== null && !METODOS_PAGO_VALIDOS.includes(metodoPago as MetodoPago)) {
      return badRequest(res, `"metodoPago" debe ser uno de: ${METODOS_PAGO_VALIDOS.join(', ')}`);
    }

    const datos: Parameters<typeof configuracionService.editarImpuesto>[1] = {};
    if (nombre !== undefined) datos.nombre = String(nombre).trim();
    if (porcentaje !== undefined) datos.porcentaje = Number(porcentaje);
    if (tipo !== undefined) datos.tipo = tipo as TipoImpuesto;
    if ('metodoPago' in req.body) datos.metodoPago = metodoPago ? (metodoPago as MetodoPago) : null;
    if (activo !== undefined) datos.activo = Boolean(activo);

    const data = await configuracionService.editarImpuesto(id, datos);
    if (!data) return res.status(404).json({ data: null, error: 'Impuesto no encontrado', message: 'Impuesto no encontrado' });

    return ok(res, data, 'Impuesto actualizado correctamente');
  } catch (err) {
    return serverError(res, err);
  }
}

export async function eliminarImpuesto(req: Request, res: Response) {
  try {
    const id = parseInt(String(req.params.id), 10);
    if (isNaN(id)) return badRequest(res, 'ID inválido');

    const data = await configuracionService.bajaLogicaImpuesto(id);
    if (!data) return res.status(404).json({ data: null, error: 'Impuesto no encontrado', message: 'Impuesto no encontrado' });

    return ok(res, data, 'Impuesto desactivado correctamente');
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
