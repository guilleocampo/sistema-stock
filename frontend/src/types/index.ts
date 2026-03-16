export type Categoria = 'QUIOSCO' | 'LIBRERIA' | 'REGALERIA';
export type MetodoPago = 'EFECTIVO' | 'TRANSFERENCIA' | 'DEBITO' | 'CREDITO';
export type TipoImpuesto = 'POR_METODO_PAGO' | 'POR_PRODUCTO';

export interface Producto {
  id: number;
  sku: string;
  nombre: string;
  categoria: Categoria;
  precioCompra: string;
  precioVenta: string;
  stockActual: number;
  stockMinimo: number;
  tieneIva: boolean;
  porcentajeIva: string;
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
  subtotalSinImpuestos: string;
  impuestoIva: string;
  impuestoMetodoPago: string;
  total: string;
  metodoPago: MetodoPago;
  items: ItemVenta[];
}

export interface ConfiguracionImpuesto {
  id: number;
  nombre: string;
  porcentaje: string;
  tipo: TipoImpuesto;
  metodoPago: MetodoPago | null;
  activo: boolean;
  actualizadoEn: string;
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

export interface DesgloseMetodoPago {
  metodoPago: MetodoPago;
  cantidadTransacciones: number;
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
  desgloseMetodoPago: DesgloseMetodoPago[];
  totalIva: number;
  totalRecargosMetodoPago: number;
  totalSinImpuestos: number;
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
