import { Request, Response } from 'express';
import { Categoria } from '@prisma/client';
import * as productoService from '../services/producto.service';

// ── Helpers ────────────────────────────────────────────────────────────────────

function ok(res: Response, data: unknown, message = 'OK') {
  return res.json({ data, error: null, message });
}

function notFound(res: Response, message = 'Producto no encontrado') {
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

export async function listar(req: Request, res: Response) {
  try {
    const { categoria, busqueda } = req.query;

    if (categoria && !Object.values(Categoria).includes(categoria as Categoria)) {
      return badRequest(res, `Categoría inválida. Valores válidos: ${Object.values(Categoria).join(', ')}`);
    }

    const productos = await productoService.listarProductos({
      categoria: categoria as Categoria | undefined,
      busqueda: busqueda as string | undefined,
    });

    return ok(res, productos);
  } catch (err) {
    return serverError(res, err);
  }
}

export async function obtenerPorId(req: Request, res: Response) {
  try {
    const id = parseInt(String(req.params.id), 10);
    if (isNaN(id)) return badRequest(res, 'ID inválido');

    const producto = await productoService.obtenerProductoPorId(id);
    if (!producto) return notFound(res);

    return ok(res, producto);
  } catch (err) {
    return serverError(res, err);
  }
}

export async function crear(req: Request, res: Response) {
  try {
    const { nombre, categoria, precioCompra, precioVenta, stockActual, stockMinimo, proveedorId } = req.body;

    if (!nombre || typeof nombre !== 'string' || nombre.trim() === '') {
      return badRequest(res, 'El nombre es obligatorio');
    }
    if (!categoria || !Object.values(Categoria).includes(categoria)) {
      return badRequest(res, `La categoría es obligatoria. Valores válidos: ${Object.values(Categoria).join(', ')}`);
    }
    if (precioCompra === undefined || isNaN(Number(precioCompra)) || Number(precioCompra) < 0) {
      return badRequest(res, 'El precio de compra es obligatorio y debe ser mayor o igual a 0');
    }
    if (precioVenta === undefined || isNaN(Number(precioVenta)) || Number(precioVenta) < 0) {
      return badRequest(res, 'El precio de venta es obligatorio y debe ser mayor o igual a 0');
    }

    const producto = await productoService.crearProducto({
      nombre: nombre.trim(),
      categoria,
      precioCompra: Number(precioCompra),
      precioVenta: Number(precioVenta),
      stockActual: stockActual !== undefined ? Number(stockActual) : undefined,
      stockMinimo: stockMinimo !== undefined ? Number(stockMinimo) : undefined,
      proveedorId: proveedorId ? Number(proveedorId) : undefined,
    });

    return res.status(201).json({ data: producto, error: null, message: 'Producto creado correctamente' });
  } catch (err) {
    if (err instanceof Error && err.message.includes('precio')) {
      return badRequest(res, err.message);
    }
    if (err instanceof Error && err.message.includes('stock')) {
      return badRequest(res, err.message);
    }
    return serverError(res, err);
  }
}

export async function editar(req: Request, res: Response) {
  try {
    const id = parseInt(String(req.params.id), 10);
    if (isNaN(id)) return badRequest(res, 'ID inválido');

    const { nombre, categoria, precioCompra, precioVenta, stockActual, stockMinimo, proveedorId } = req.body;

    if (categoria !== undefined && !Object.values(Categoria).includes(categoria)) {
      return badRequest(res, `Categoría inválida. Valores válidos: ${Object.values(Categoria).join(', ')}`);
    }
    if (precioCompra !== undefined && (isNaN(Number(precioCompra)) || Number(precioCompra) < 0)) {
      return badRequest(res, 'El precio de compra debe ser mayor o igual a 0');
    }
    if (precioVenta !== undefined && (isNaN(Number(precioVenta)) || Number(precioVenta) < 0)) {
      return badRequest(res, 'El precio de venta debe ser mayor o igual a 0');
    }

    const datos: productoService.DatosEditarProducto = {};
    if (nombre !== undefined) datos.nombre = String(nombre).trim();
    if (categoria !== undefined) datos.categoria = categoria;
    if (precioCompra !== undefined) datos.precioCompra = Number(precioCompra);
    if (precioVenta !== undefined) datos.precioVenta = Number(precioVenta);
    if (stockActual !== undefined) datos.stockActual = Number(stockActual);
    if (stockMinimo !== undefined) datos.stockMinimo = Number(stockMinimo);
    if ('proveedorId' in req.body) datos.proveedorId = proveedorId ? Number(proveedorId) : null;

    const producto = await productoService.editarProducto(id, datos);
    if (!producto) return notFound(res);

    return ok(res, producto, 'Producto actualizado correctamente');
  } catch (err) {
    if (err instanceof Error && (err.message.includes('precio') || err.message.includes('stock'))) {
      return badRequest(res, err.message);
    }
    return serverError(res, err);
  }
}

export async function darDeBaja(req: Request, res: Response) {
  try {
    const id = parseInt(String(req.params.id), 10);
    if (isNaN(id)) return badRequest(res, 'ID inválido');

    const producto = await productoService.bajaLogicaProducto(id);
    if (!producto) return notFound(res);

    return ok(res, null, 'Producto dado de baja correctamente');
  } catch (err) {
    return serverError(res, err);
  }
}

export async function bajoStock(req: Request, res: Response) {
  try {
    const productos = await productoService.listarProductosBajoStock();
    return ok(res, productos, `${productos.length} producto(s) con bajo stock`);
  } catch (err) {
    return serverError(res, err);
  }
}
