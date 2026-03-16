export type Categoria = 'QUIOSCO' | 'LIBRERIA' | 'REGALERIA';

export interface Producto {
  id: number;
  sku: string;
  nombre: string;
  categoria: Categoria;
  precioCompra: string;
  precioVenta: string;
  stockActual: number;
  stockMinimo: number;
  activo: boolean;
  proveedorId: number | null;
  proveedor: { id: number; nombre: string } | null;
}

export interface ItemVenta {
  id: number;
  ventaId: number;
  productoId: number;
  cantidad: number;
  precioUnitario: string;
  subtotal: string;
  producto: Pick<Producto, 'id' | 'sku' | 'nombre' | 'categoria' | 'precioCompra'>;
}

export interface Venta {
  id: number;
  fechaHora: string;
  total: string;
  items: ItemVenta[];
}

export interface ItemCarrito {
  producto: Producto;
  cantidad: number;
}

// ── Reportes ──────────────────────────────────────────────────────────────────

export type Periodo = 'hoy' | 'semana' | 'mes' | 'anio' | 'personalizado';

export interface TopProducto {
  producto: Pick<Producto, 'id' | 'sku' | 'nombre' | 'categoria'> | null;
  unidadesVendidas: number;
  montoTotal: number;
}

export interface DesgloseCategoria {
  categoria: Categoria;
  unidadesVendidas: number;
  montoTotal: number;
}

export interface ResumenReporte {
  periodo: Periodo;
  desde: string;
  hasta: string;
  totalRecaudado: number;
  cantidadVentas: number;
  ticketPromedio: number;
  gananciaTotal: number;
  topProductos: TopProducto[];
  desgloseCategoria: DesgloseCategoria[];
}

export interface ConfiguracionGanancia {
  id: number;
  categoria: Categoria;
  porcentaje: number;
  actualizadoEn: string;
  cantidadProductos: number;
}

export interface HistorialPaginado {
  ventas: Venta[];
  total: number;
  pagina: number;
  porPagina: number;
  totalPaginas: number;
}

export interface ProductoSinMovimiento {
  id: number;
  sku: string;
  nombre: string;
  categoria: Categoria;
  stockActual: number;
  stockMinimo: number;
  diasSinVenta: number | null;
  ultimaVenta: string | null;
  proveedor: { id: number; nombre: string } | null;
}
