import { Request, Response } from 'express';
import * as proveedorService from '../services/proveedor.service';

// ── Helpers ────────────────────────────────────────────────────────────────────

function ok(res: Response, data: unknown, message = 'OK') {
  return res.json({ data, error: null, message });
}

function notFound(res: Response, message = 'Proveedor no encontrado') {
  return res.status(404).json({ data: null, error: message, message });
}

function badRequest(res: Response, message: string) {
  return res.status(400).json({ data: null, error: message, message });
}

function serverError(res: Response, err: unknown) {
  const message = err instanceof Error ? err.message : 'Error interno del servidor';
  return res.status(500).json({ data: null, error: message, message });
}

// ── Controladores ──────────────────────────────────────────────────────────────

export async function listar(_req: Request, res: Response) {
  try {
    const proveedores = await proveedorService.listarProveedores();
    return ok(res, proveedores);
  } catch (err) {
    return serverError(res, err);
  }
}

export async function obtenerPorId(req: Request, res: Response) {
  try {
    const id = parseInt(String(req.params.id), 10);
    if (isNaN(id)) return badRequest(res, 'ID inválido');

    const proveedor = await proveedorService.obtenerProveedorPorId(id);
    if (!proveedor) return notFound(res);

    return ok(res, proveedor);
  } catch (err) {
    return serverError(res, err);
  }
}

export async function crear(req: Request, res: Response) {
  try {
    const { nombre, telefono, email, notas } = req.body;

    if (!nombre || typeof nombre !== 'string' || nombre.trim() === '') {
      return badRequest(res, 'El nombre es obligatorio');
    }

    const proveedor = await proveedorService.crearProveedor({
      nombre: nombre.trim(),
      telefono: telefono ? String(telefono).trim() : undefined,
      email: email ? String(email).trim() : undefined,
      notas: notas ? String(notas).trim() : undefined,
    });

    return res.status(201).json({ data: proveedor, error: null, message: 'Proveedor creado correctamente' });
  } catch (err) {
    if (err instanceof Error && err.message.includes('Ya existe')) {
      return badRequest(res, err.message);
    }
    return serverError(res, err);
  }
}

export async function editar(req: Request, res: Response) {
  try {
    const id = parseInt(String(req.params.id), 10);
    if (isNaN(id)) return badRequest(res, 'ID inválido');

    const { nombre, telefono, email, notas, activo } = req.body;

    if (nombre !== undefined && (typeof nombre !== 'string' || nombre.trim() === '')) {
      return badRequest(res, 'El nombre no puede estar vacío');
    }

    if (activo !== undefined && typeof activo !== 'boolean') {
      return badRequest(res, 'El campo activo debe ser un booleano');
    }

    const datos: proveedorService.DatosEditarProveedor = {};
    if (nombre !== undefined) datos.nombre = String(nombre).trim();
    if ('telefono' in req.body) datos.telefono = telefono ? String(telefono).trim() : null;
    if ('email' in req.body) datos.email = email ? String(email).trim() : null;
    if ('notas' in req.body) datos.notas = notas ? String(notas).trim() : null;
    if (activo !== undefined) datos.activo = activo;

    const proveedor = await proveedorService.editarProveedor(id, datos);
    if (!proveedor) return notFound(res);

    return ok(res, proveedor, 'Proveedor actualizado correctamente');
  } catch (err) {
    if (err instanceof Error && err.message.includes('Ya existe')) {
      return badRequest(res, err.message);
    }
    return serverError(res, err);
  }
}

export async function darDeBaja(req: Request, res: Response) {
  try {
    const id = parseInt(String(req.params.id), 10);
    if (isNaN(id)) return badRequest(res, 'ID inválido');

    const proveedor = await proveedorService.bajaLogicaProveedor(id);
    if (!proveedor) return notFound(res);

    return ok(res, null, 'Proveedor dado de baja correctamente');
  } catch (err) {
    return serverError(res, err);
  }
}
