import { useState, useEffect, useMemo } from 'react';
import type { Producto, Categoria } from '../types';
import { apiFetch } from '../services/api';
import ProductoModal from '../components/productos/ProductoModal';
import ConfirmDialog from '../components/ui/ConfirmDialog';

// ── Helpers visuales ───────────────────────────────────────────────────────────

const CATEGORIA_BADGE: Record<Categoria, { bg: string; color: string; label: string }> = {
  QUIOSCO:   { bg: '#fef9c3', color: '#854d0e', label: 'Quiosco' },
  LIBRERIA:  { bg: '#dbeafe', color: '#1e3a8a', label: 'Librería' },
  REGALERIA: { bg: '#f3e8ff', color: '#6b21a8', label: 'Regalería' },
};

function getEstadoStock(stockActual: number, stockMinimo: number) {
  if (stockActual === 0)
    return { bg: '#fee2e2', color: '#991b1b', rowBg: '#fff5f5', label: 'Sin stock', nivel: 2 };
  if (stockActual <= stockMinimo)
    return { bg: '#fef9c3', color: '#854d0e', rowBg: '#fefce8', label: 'Stock bajo', nivel: 1 };
  return { bg: '#dcfce7', color: '#166534', rowBg: 'white', label: 'OK', nivel: 0 };
}

function formatPrecio(valor: string | number) {
  return Number(valor).toLocaleString('es-AR', { minimumFractionDigits: 2 });
}

// ── Ícono de lápiz ─────────────────────────────────────────────────────────────

function IconEditar() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
    </svg>
  );
}

function IconDesactivar() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/>
    </svg>
  );
}

// ── Tarjetas de resumen ────────────────────────────────────────────────────────

function StatCard({
  label, valor, color, bg,
}: { label: string; valor: number; color: string; bg: string }) {
  return (
    <div
      style={{
        background: bg, border: `1px solid ${color}33`,
        borderRadius: 10, padding: '14px 20px',
        display: 'flex', flexDirection: 'column', gap: 3,
        minWidth: 140,
      }}
    >
      <span style={{ fontSize: 26, fontWeight: 700, color, lineHeight: 1 }}>{valor}</span>
      <span style={{ fontSize: 12, color, fontWeight: 500 }}>{label}</span>
    </div>
  );
}

// ── Componente principal ───────────────────────────────────────────────────────

export default function Productos() {
  const [productos, setProductos] = useState<Producto[]>([]);
  const [cargando, setCargando] = useState(true);
  const [errorCarga, setErrorCarga] = useState<string | null>(null);

  const [busqueda, setBusqueda] = useState('');
  const [categoriaFiltro, setCategoriaFiltro] = useState<Categoria | ''>('');

  const [modalAbierto, setModalAbierto] = useState(false);
  const [productoEditando, setProductoEditando] = useState<Producto | null>(null);
  const [productoDesactivando, setProductoDesactivando] = useState<Producto | null>(null);
  const [desactivando, setDesactivando] = useState(false);

  // ── Carga de productos ───────────────────────────────────────────────────────

  const cargarProductos = async () => {
    setCargando(true);
    setErrorCarga(null);
    try {
      const json = await apiFetch<Producto[]>('/api/productos');
      setProductos(json.data ?? []);
    } catch {
      setErrorCarga('No se pudo cargar la lista de productos. Verificá que el backend esté corriendo.');
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => { cargarProductos(); }, []);

  // ── Filtrado client-side ─────────────────────────────────────────────────────

  const productosFiltrados = useMemo(() => {
    const termino = busqueda.trim().toLowerCase();
    return productos
      .filter((p) => {
        const matchBusqueda = !termino ||
          p.nombre.toLowerCase().includes(termino) ||
          p.sku.toLowerCase().includes(termino);
        const matchCategoria = !categoriaFiltro || p.categoria === categoriaFiltro;
        return matchBusqueda && matchCategoria;
      })
      // Mostrar primero los que tienen problemas de stock
      .sort((a, b) => getEstadoStock(b.stockActual, b.stockMinimo).nivel - getEstadoStock(a.stockActual, a.stockMinimo).nivel);
  }, [productos, busqueda, categoriaFiltro]);

  // ── Stats ────────────────────────────────────────────────────────────────────

  const stats = useMemo(() => ({
    total: productos.length,
    bajoStock: productos.filter((p) => p.stockActual > 0 && p.stockActual <= p.stockMinimo).length,
    sinStock: productos.filter((p) => p.stockActual === 0).length,
  }), [productos]);

  // ── Handlers ─────────────────────────────────────────────────────────────────

  const abrirCrear = () => {
    setProductoEditando(null);
    setModalAbierto(true);
  };

  const abrirEditar = (p: Producto) => {
    setProductoEditando(p);
    setModalAbierto(true);
  };

  const cerrarModal = () => {
    setModalAbierto(false);
    setProductoEditando(null);
  };

  const guardarProducto = async (datos: Record<string, unknown>) => {
    const path = productoEditando
      ? `/api/productos/${productoEditando.id}`
      : '/api/productos';
    const method = productoEditando ? 'PUT' : 'POST';

    await apiFetch(path, {
      method,
      body: JSON.stringify(datos),
    });

    await cargarProductos();
    cerrarModal();
  };

  const confirmarDesactivar = async () => {
    if (!productoDesactivando) return;
    setDesactivando(true);
    try {
      await apiFetch(`/api/productos/${productoDesactivando.id}`, { method: 'DELETE' });
      await cargarProductos();
      setProductoDesactivando(null);
    } catch {
      setProductoDesactivando(null);
    } finally {
      setDesactivando(false);
    }
  };

  // ── Render ───────────────────────────────────────────────────────────────────

  return (
    <div style={{ padding: '24px 28px' }}>

      {/* ── Encabezado + botón ─────────────────────────────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 20 }}>
        <div style={{ display: 'flex', gap: 12 }}>
          <StatCard label="Total activos" valor={stats.total} color="#16a34a" bg="#f0fdf4" />
          {stats.bajoStock > 0 && (
            <StatCard label="Stock bajo" valor={stats.bajoStock} color="#854d0e" bg="#fefce8" />
          )}
          {stats.sinStock > 0 && (
            <StatCard label="Sin stock" valor={stats.sinStock} color="#991b1b" bg="#fff5f5" />
          )}
        </div>

        <button
          onClick={abrirCrear}
          style={{
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '10px 20px', background: 'var(--green)',
            color: 'white', border: 'none', borderRadius: 9,
            fontSize: 14, fontWeight: 700, fontFamily: 'inherit',
            cursor: 'pointer', whiteSpace: 'nowrap',
          }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = '#15803d'; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'var(--green)'; }}
        >
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          Nuevo Producto
        </button>
      </div>

      {/* ── Buscador + filtros ─────────────────────────────────────────────── */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
        <div
          style={{
            flex: 1, display: 'flex', alignItems: 'center', gap: 10,
            background: 'white', border: '1.5px solid var(--border)',
            borderRadius: 9, padding: '9px 14px',
          }}
        >
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Buscar por nombre o SKU..."
            style={{
              flex: 1, border: 'none', outline: 'none', fontSize: 14,
              fontFamily: 'inherit', color: 'var(--text-primary)', background: 'transparent',
            }}
          />
          {busqueda && (
            <button onClick={() => setBusqueda('')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', fontSize: 17, padding: 0, lineHeight: 1 }}>✕</button>
          )}
        </div>

        <select
          value={categoriaFiltro}
          onChange={(e) => setCategoriaFiltro(e.target.value as Categoria | '')}
          style={{
            padding: '9px 14px', border: '1.5px solid var(--border)',
            borderRadius: 9, fontSize: 14, fontFamily: 'inherit',
            color: 'var(--text-primary)', background: 'white', cursor: 'pointer',
            outline: 'none', minWidth: 160,
          }}
        >
          <option value="">Todas las categorías</option>
          <option value="QUIOSCO">Quiosco</option>
          <option value="LIBRERIA">Librería</option>
          <option value="REGALERIA">Regalería</option>
        </select>
      </div>

      {/* ── Tabla ─────────────────────────────────────────────────────────── */}
      <div
        style={{
          background: 'white', borderRadius: 12,
          border: '1px solid var(--border)', overflow: 'hidden',
          boxShadow: '0 1px 4px rgba(0,0,0,0.05)',
        }}
      >
        {/* Cabecera */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '90px 1fr 110px 120px 120px 90px 100px 90px',
            padding: '10px 20px',
            background: '#f9fafb',
            borderBottom: '2px solid var(--border)',
          }}
        >
          {['SKU', 'Nombre', 'Categoría', 'P. Compra', 'P. Venta', 'Stock', 'Estado', 'Acciones'].map((col, i) => (
            <div key={i} style={{
              fontSize: 11, fontWeight: 700,
              color: 'var(--text-secondary)',
              textTransform: 'uppercase', letterSpacing: '0.06em',
              textAlign: i >= 3 && i <= 5 ? 'right' : i === 7 ? 'center' : 'left',
            }}>
              {col}
            </div>
          ))}
        </div>

        {/* Estado de carga / error */}
        {cargando && (
          <div style={{ padding: '48px 24px', textAlign: 'center', color: 'var(--text-secondary)', fontSize: 14 }}>
            Cargando productos...
          </div>
        )}

        {errorCarga && !cargando && (
          <div style={{ padding: '32px 24px', textAlign: 'center', color: 'var(--red)', fontSize: 14 }}>
            {errorCarga}
          </div>
        )}

        {/* Vacío */}
        {!cargando && !errorCarga && productosFiltrados.length === 0 && (
          <div style={{ padding: '56px 24px', textAlign: 'center' }}>
            <div style={{ fontSize: 40, marginBottom: 12, opacity: 0.25 }}>📦</div>
            <div style={{ fontSize: 15, fontWeight: 500, color: '#9ca3af' }}>
              {productos.length === 0
                ? 'No hay productos cargados todavía'
                : 'No se encontraron productos con ese criterio'}
            </div>
            {productos.length === 0 && (
              <button
                onClick={abrirCrear}
                style={{
                  marginTop: 16, padding: '9px 20px',
                  background: 'var(--green)', color: 'white',
                  border: 'none', borderRadius: 8, fontSize: 14,
                  fontWeight: 600, fontFamily: 'inherit', cursor: 'pointer',
                }}
              >
                + Agregar primer producto
              </button>
            )}
          </div>
        )}

        {/* Filas */}
        {!cargando && !errorCarga && productosFiltrados.map((producto, idx) => {
          const stock = getEstadoStock(producto.stockActual, producto.stockMinimo);
          const catBadge = CATEGORIA_BADGE[producto.categoria];
          const esUltimo = idx === productosFiltrados.length - 1;

          return (
            <div
              key={producto.id}
              style={{
                display: 'grid',
                gridTemplateColumns: '90px 1fr 110px 120px 120px 90px 100px 90px',
                alignItems: 'center',
                padding: '12px 20px',
                borderBottom: esUltimo ? 'none' : '1px solid var(--border)',
                background: stock.rowBg,
                transition: 'filter 0.1s',
              }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.filter = 'brightness(0.975)'; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.filter = 'none'; }}
            >
              {/* SKU */}
              <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', fontVariantNumeric: 'tabular-nums' }}>
                {producto.sku}
              </div>

              {/* Nombre + proveedor */}
              <div>
                <div style={{ fontWeight: 500, fontSize: 14, color: 'var(--text-primary)' }}>
                  {producto.nombre}
                </div>
                {producto.proveedor && (
                  <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 1 }}>
                    {producto.proveedor.nombre}
                  </div>
                )}
              </div>

              {/* Categoría */}
              <div>
                <span style={{
                  background: catBadge.bg, color: catBadge.color,
                  padding: '3px 8px', borderRadius: 20,
                  fontSize: 11, fontWeight: 600,
                }}>
                  {catBadge.label}
                </span>
              </div>

              {/* Precio compra */}
              <div style={{ textAlign: 'right', fontSize: 13, color: 'var(--text-secondary)' }}>
                ${formatPrecio(producto.precioCompra)}
              </div>

              {/* Precio venta */}
              <div style={{ textAlign: 'right', fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>
                ${formatPrecio(producto.precioVenta)}
              </div>

              {/* Stock numérico */}
              <div style={{
                textAlign: 'right',
                fontSize: 15, fontWeight: 700,
                color: stock.nivel > 0 ? stock.color : 'var(--text-primary)',
              }}>
                {producto.stockActual}
                <span style={{ fontSize: 11, fontWeight: 400, color: 'var(--text-secondary)', marginLeft: 3 }}>
                  / {producto.stockMinimo}
                </span>
              </div>

              {/* Badge estado */}
              <div>
                <span style={{
                  background: stock.bg, color: stock.color,
                  padding: '3px 9px', borderRadius: 20,
                  fontSize: 11, fontWeight: 600,
                }}>
                  {stock.label}
                </span>
              </div>

              {/* Acciones */}
              <div style={{ display: 'flex', gap: 6, justifyContent: 'center' }}>
                <button
                  onClick={() => abrirEditar(producto)}
                  title="Editar"
                  style={{
                    width: 30, height: 30, border: '1.5px solid var(--border)',
                    borderRadius: 7, background: 'white', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: 'var(--text-secondary)', transition: 'all 0.12s',
                  }}
                  onMouseEnter={(e) => {
                    const el = e.currentTarget as HTMLElement;
                    el.style.background = '#eff6ff';
                    el.style.borderColor = '#93c5fd';
                    el.style.color = '#1d4ed8';
                  }}
                  onMouseLeave={(e) => {
                    const el = e.currentTarget as HTMLElement;
                    el.style.background = 'white';
                    el.style.borderColor = 'var(--border)';
                    el.style.color = 'var(--text-secondary)';
                  }}
                >
                  <IconEditar />
                </button>

                <button
                  onClick={() => setProductoDesactivando(producto)}
                  title="Desactivar"
                  style={{
                    width: 30, height: 30, border: '1.5px solid var(--border)',
                    borderRadius: 7, background: 'white', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: 'var(--text-secondary)', transition: 'all 0.12s',
                  }}
                  onMouseEnter={(e) => {
                    const el = e.currentTarget as HTMLElement;
                    el.style.background = '#fff5f5';
                    el.style.borderColor = '#fca5a5';
                    el.style.color = 'var(--red)';
                  }}
                  onMouseLeave={(e) => {
                    const el = e.currentTarget as HTMLElement;
                    el.style.background = 'white';
                    el.style.borderColor = 'var(--border)';
                    el.style.color = 'var(--text-secondary)';
                  }}
                >
                  <IconDesactivar />
                </button>
              </div>
            </div>
          );
        })}

        {/* Pie de tabla */}
        {!cargando && productosFiltrados.length > 0 && (
          <div style={{
            padding: '10px 20px',
            borderTop: '1px solid var(--border)',
            background: '#f9fafb',
            fontSize: 12, color: 'var(--text-secondary)',
          }}>
            {productosFiltrados.length === productos.length
              ? `${productos.length} producto${productos.length !== 1 ? 's' : ''} en total`
              : `Mostrando ${productosFiltrados.length} de ${productos.length} productos`}
          </div>
        )}
      </div>

      {/* ── Modales ───────────────────────────────────────────────────────── */}
      {modalAbierto && (
        <ProductoModal
          producto={productoEditando}
          onGuardar={guardarProducto}
          onCerrar={cerrarModal}
        />
      )}

      {productoDesactivando && (
        <ConfirmDialog
          titulo="¿Desactivar producto?"
          mensaje={`El producto "${productoDesactivando.nombre}" (${productoDesactivando.sku}) quedará inactivo y no aparecerá en ventas ni búsquedas. Podés reactivarlo después si lo necesitás.`}
          labelConfirmar="Sí, desactivar"
          peligroso
          cargando={desactivando}
          onConfirmar={confirmarDesactivar}
          onCancelar={() => setProductoDesactivando(null)}
        />
      )}
    </div>
  );
}
