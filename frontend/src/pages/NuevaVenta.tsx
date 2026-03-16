import { useState, useEffect, useRef } from 'react';
import type { Producto, ItemCarrito, Venta, MetodoPago, ConfiguracionImpuesto } from '../types';
import { apiFetch } from '../services/api';

// ── Método de pago ─────────────────────────────────────────────────────────────

const METODOS_PAGO: { value: MetodoPago; label: string; emoji: string }[] = [
  { value: 'EFECTIVO',      label: 'Efectivo',      emoji: '💵' },
  { value: 'TRANSFERENCIA', label: 'Transferencia',  emoji: '📲' },
  { value: 'DEBITO',        label: 'Débito',         emoji: '💳' },
  { value: 'CREDITO',       label: 'Crédito',        emoji: '💳' },
];

// ── Helpers visuales ───────────────────────────────────────────────────────────

const CATEGORIA_BADGE: Record<string, { bg: string; color: string; label: string }> = {
  QUIOSCO:   { bg: '#fef9c3', color: '#854d0e', label: 'Quiosco' },
  LIBRERIA:  { bg: '#dbeafe', color: '#1e3a8a', label: 'Librería' },
  REGALERIA: { bg: '#f3e8ff', color: '#6b21a8', label: 'Regalería' },
};

function formatPrecio(valor: string | number) {
  return Number(valor).toLocaleString('es-AR', { minimumFractionDigits: 2 });
}

// ── Sub-componentes ────────────────────────────────────────────────────────────

function FilaCarrito({
  item,
  onCambiarCantidad,
  onQuitar,
}: {
  item: ItemCarrito;
  onCambiarCantidad: (id: number, cantidad: number) => void;
  onQuitar: (id: number) => void;
}) {
  const subtotal = Number(item.producto.precioVenta) * item.cantidad;
  const sinStock = item.cantidad > item.producto.stockActual;

  const badge = CATEGORIA_BADGE[item.producto.categoria];

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: '1fr 110px 130px 150px 120px 48px',
        alignItems: 'center',
        padding: '13px 20px',
        borderBottom: '1px solid var(--border)',
        background: sinStock ? '#fff5f5' : 'white',
        transition: 'background 0.15s',
      }}
    >
      {/* Nombre + SKU */}
      <div>
        <div style={{ fontWeight: 500, fontSize: 14, color: 'var(--text-primary)' }}>
          {item.producto.nombre}
        </div>
        <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2, display: 'flex', alignItems: 'center', gap: 8 }}>
          <span>{item.producto.sku}</span>
          {sinStock && (
            <span style={{ color: 'var(--red)', fontWeight: 600, fontSize: 12 }}>
              ⚠ Stock insuficiente (hay {item.producto.stockActual})
            </span>
          )}
        </div>
      </div>

      {/* Categoría */}
      <div style={{ display: 'flex', alignItems: 'center' }}>
        <span style={{ background: badge.bg, color: badge.color, padding: '3px 8px', borderRadius: 20, fontWeight: 500, fontSize: 11, whiteSpace: 'nowrap' }}>
          {badge.label}
        </span>
      </div>

      {/* Precio unitario */}
      <div style={{ textAlign: 'right', fontSize: 14, color: 'var(--text-secondary)', paddingRight: 8 }}>
        ${formatPrecio(item.producto.precioVenta)}
      </div>

      {/* Cantidad */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
        <button
          onClick={() => onCambiarCantidad(item.producto.id, item.cantidad - 1)}
          style={btnCantidadStyle}
        >
          −
        </button>
        <input
          type="number"
          min={1}
          value={item.cantidad}
          onChange={(e) => {
            const val = parseInt(e.target.value, 10);
            if (!isNaN(val) && val > 0) onCambiarCantidad(item.producto.id, val);
          }}
          style={{
            width: 48,
            textAlign: 'center',
            border: `1.5px solid ${sinStock ? 'var(--red)' : 'var(--border)'}`,
            borderRadius: 7,
            padding: '5px 0',
            fontSize: 14,
            fontFamily: 'inherit',
            fontWeight: 600,
            color: sinStock ? 'var(--red)' : 'var(--text-primary)',
            outline: 'none',
            background: 'white',
          }}
        />
        <button
          onClick={() => onCambiarCantidad(item.producto.id, item.cantidad + 1)}
          style={btnCantidadStyle}
        >
          +
        </button>
      </div>

      {/* Subtotal */}
      <div style={{ textAlign: 'right', fontWeight: 600, fontSize: 15, color: 'var(--text-primary)', paddingRight: 8 }}>
        ${formatPrecio(subtotal)}
      </div>

      {/* Quitar */}
      <div style={{ display: 'flex', justifyContent: 'center' }}>
        <button
          onClick={() => onQuitar(item.producto.id)}
          title="Quitar"
          style={{
            width: 32, height: 32, border: 'none', borderRadius: 7,
            background: 'transparent', cursor: 'pointer', color: '#d1d5db',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            transition: 'all 0.12s',
          }}
          onMouseEnter={(e) => {
            const el = e.currentTarget as HTMLElement;
            el.style.background = '#fee2e2';
            el.style.color = 'var(--red)';
          }}
          onMouseLeave={(e) => {
            const el = e.currentTarget as HTMLElement;
            el.style.background = 'transparent';
            el.style.color = '#d1d5db';
          }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="3 6 5 6 21 6" />
            <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
            <path d="M10 11v6" /><path d="M14 11v6" />
            <path d="M9 6V4h6v2" />
          </svg>
        </button>
      </div>
    </div>
  );
}

const btnCantidadStyle: React.CSSProperties = {
  width: 30, height: 30,
  border: '1.5px solid var(--border)',
  borderRadius: 7,
  background: '#f9fafb',
  cursor: 'pointer',
  fontFamily: 'inherit',
  fontSize: 17,
  fontWeight: 500,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  color: 'var(--text-primary)',
  flexShrink: 0,
};

// ── Modal de venta exitosa ─────────────────────────────────────────────────────

function ModalExito({ venta, onNuevaVenta }: { venta: Venta; onNuevaVenta: () => void }) {
  return (
    <div
      style={{
        position: 'fixed', inset: 0,
        background: 'rgba(15, 17, 23, 0.6)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 1000,
        backdropFilter: 'blur(2px)',
      }}
    >
      <div
        style={{
          background: 'white',
          borderRadius: 16,
          padding: '36px 32px',
          width: 440,
          maxWidth: '90vw',
          boxShadow: '0 24px 64px rgba(0,0,0,0.25)',
          animation: 'slideUp 0.25s ease',
        }}
      >
        {/* Ícono éxito */}
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <div style={{
            width: 72, height: 72, borderRadius: '50%',
            background: '#dcfce7', margin: '0 auto 16px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 36,
          }}>
            ✓
          </div>
          <h2 style={{ margin: '0 0 6px', fontSize: 22, fontWeight: 700, color: 'var(--text-primary)' }}>
            ¡Venta registrada!
          </h2>
          <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: 14 }}>
            Venta #{venta.id} · {new Date(venta.fechaHora).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })} hs
          </p>
        </div>

        {/* Items */}
        <div style={{ background: '#f9fafb', borderRadius: 10, padding: '4px 0', marginBottom: 16 }}>
          {venta.items.map((item) => (
            <div
              key={item.id}
              style={{
                display: 'flex', justifyContent: 'space-between',
                padding: '10px 16px', fontSize: 14,
                borderBottom: '1px solid var(--border)',
              }}
            >
              <span style={{ color: 'var(--text-primary)' }}>
                {item.producto?.nombre}
                <span style={{ color: 'var(--text-secondary)', marginLeft: 6 }}>× {item.cantidad}</span>
              </span>
              <span style={{ fontWeight: 600 }}>
                ${formatPrecio(item.subtotal)}
              </span>
            </div>
          ))}
        </div>

        {/* Total */}
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          padding: '14px 4px 20px',
        }}>
          <span style={{ fontSize: 15, fontWeight: 600 }}>Total cobrado</span>
          <span style={{ fontSize: 28, fontWeight: 700, color: 'var(--green)' }}>
            ${formatPrecio(venta.total)}
          </span>
        </div>

        <button
          onClick={onNuevaVenta}
          style={{
            width: '100%', padding: '14px',
            background: 'var(--green)', color: 'white',
            border: 'none', borderRadius: 10,
            fontSize: 16, fontWeight: 700, fontFamily: 'inherit',
            cursor: 'pointer',
          }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = '#15803d'; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'var(--green)'; }}
        >
          + Nueva Venta
        </button>
      </div>

      <style>{`@keyframes slideUp { from { opacity:0; transform:translateY(16px); } to { opacity:1; transform:translateY(0); } }`}</style>
    </div>
  );
}

// ── Componente principal ───────────────────────────────────────────────────────

export default function NuevaVenta() {
  const [busqueda, setBusqueda] = useState('');
  const [resultados, setResultados] = useState<Producto[]>([]);
  const [buscando, setBuscando] = useState(false);
  const [mostrarDropdown, setMostrarDropdown] = useState(false);
  const [carrito, setCarrito] = useState<ItemCarrito[]>([]);
  const [metodoPago, setMetodoPago] = useState<MetodoPago | null>(null);
  const [pctRecargoCredito, setPctRecargoCredito] = useState(0);
  const [pctRecargoTransferencia, setPctRecargoTransferencia] = useState(0);
  const [confirmando, setConfirmando] = useState(false);
  const [mostrarResumen, setMostrarResumen] = useState(false);
  const [ventaExitosa, setVentaExitosa] = useState<Venta | null>(null);
  const [errorServidor, setErrorServidor] = useState<string | null>(null);

  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const timerBusqueda = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Cargar % recargo crédito al montar
  useEffect(() => {
    apiFetch<ConfiguracionImpuesto[]>('/api/configuracion/impuestos')
      .then((json) => {
        const impuestos: ConfiguracionImpuesto[] = json.data ?? [];
        const credito = impuestos.find(
          (i) => i.tipo === 'POR_METODO_PAGO' && i.metodoPago === 'CREDITO' && i.activo
        );
        if (credito) setPctRecargoCredito(Number(credito.porcentaje));

        const transferencia = impuestos.find(
          (i) => i.tipo === 'POR_METODO_PAGO' && i.metodoPago === 'TRANSFERENCIA' && i.activo
        );
        if (transferencia) setPctRecargoTransferencia(Number(transferencia.porcentaje));
      })
      .catch(() => {/* silencioso */});
  }, []);

  // Cerrar dropdown al hacer click fuera
  useEffect(() => {
    function handleClickFuera(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setMostrarDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClickFuera);
    return () => document.removeEventListener('mousedown', handleClickFuera);
  }, []);

  // Búsqueda con debounce de 300ms
  useEffect(() => {
    if (timerBusqueda.current) clearTimeout(timerBusqueda.current);

    const termino = busqueda.trim();
    if (termino.length < 2) {
      setResultados([]);
      setMostrarDropdown(false);
      return;
    }

    setBuscando(true);
    timerBusqueda.current = setTimeout(async () => {
      try {
        const json = await apiFetch<Producto[]>(`/api/productos?busqueda=${encodeURIComponent(termino)}`);
        setResultados(json.data ?? []);
        setMostrarDropdown(true);
      } catch {
        setResultados([]);
      } finally {
        setBuscando(false);
      }
    }, 300);

    return () => { if (timerBusqueda.current) clearTimeout(timerBusqueda.current); };
  }, [busqueda]);

  const agregarAlCarrito = (producto: Producto) => {
    setCarrito((prev) => {
      const existente = prev.find((i) => i.producto.id === producto.id);
      if (existente) {
        return prev.map((i) =>
          i.producto.id === producto.id ? { ...i, cantidad: i.cantidad + 1 } : i
        );
      }
      return [...prev, { producto, cantidad: 1 }];
    });
    setBusqueda('');
    setMostrarDropdown(false);
    setErrorServidor(null);
    inputRef.current?.focus();
  };

  const cambiarCantidad = (productoId: number, cantidad: number) => {
    if (cantidad < 1) return;
    setCarrito((prev) =>
      prev.map((i) => (i.producto.id === productoId ? { ...i, cantidad } : i))
    );
  };

  const quitarDelCarrito = (productoId: number) => {
    setCarrito((prev) => prev.filter((i) => i.producto.id !== productoId));
    setErrorServidor(null);
  };

  const subtotalSinImpuestos = carrito.reduce(
    (acc, item) => acc + Number(item.producto.precioVenta) * item.cantidad,
    0
  );

  const ivaCalculado = carrito.reduce((acc, item) => {
    if (!item.producto.tieneIva) return acc;
    return acc + Number(item.producto.precioVenta) * item.cantidad * (Number(item.producto.porcentajeIva) / 100);
  }, 0);

  const recargoCredito = metodoPago === 'CREDITO'
    ? subtotalSinImpuestos * (pctRecargoCredito / 100)
    : 0;

  const recargoTransferencia = metodoPago === 'TRANSFERENCIA'
    ? subtotalSinImpuestos * (pctRecargoTransferencia / 100)
    : 0;

  const total = subtotalSinImpuestos + ivaCalculado + recargoCredito + recargoTransferencia;

  const hayErroresStock = carrito.some((i) => i.cantidad > i.producto.stockActual);
  const carritoVacio = carrito.length === 0;
  const puedeConfirmar = !carritoVacio && !hayErroresStock && !confirmando && metodoPago !== null;

  const confirmarVenta = async () => {
    if (!puedeConfirmar) return;
    setConfirmando(true);
    setErrorServidor(null);

    try {
      const json = await apiFetch<Venta>('/api/ventas', {
        method: 'POST',
        body: JSON.stringify({
          items: carrito.map((i) => ({ productoId: i.producto.id, cantidad: i.cantidad })),
          metodoPago,
        }),
      });
      setMostrarResumen(false);
      setVentaExitosa(json.data);
      setCarrito([]);
    } catch (err) {
      setErrorServidor(err instanceof Error ? err.message : 'No se pudo conectar con el servidor.');
    } finally {
      setConfirmando(false);
    }
  };

  const iniciarNuevaVenta = () => {
    setVentaExitosa(null);
    setErrorServidor(null);
    setMetodoPago(null);
    setTimeout(() => inputRef.current?.focus(), 100);
  };

  return (
    <div style={{ padding: '24px 28px', maxWidth: 1000, margin: '0 auto' }}>

      {/* ── Buscador ─────────────────────────────────────────────────────────── */}
      <div ref={dropdownRef} style={{ position: 'relative', marginBottom: 20 }}>
        <div
          style={{
            display: 'flex', alignItems: 'center', gap: 12,
            background: 'white',
            border: '2px solid',
            borderColor: mostrarDropdown ? 'var(--green)' : 'var(--border)',
            borderRadius: 12,
            padding: '11px 16px',
            transition: 'border-color 0.15s',
            boxShadow: mostrarDropdown ? '0 0 0 3px #dcfce7' : 'none',
          }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            ref={inputRef}
            autoFocus
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Buscar producto por nombre o código SKU... (ej: Coca, SKU-0001)"
            style={{
              flex: 1, border: 'none', outline: 'none',
              fontSize: 15, fontFamily: 'inherit',
              color: 'var(--text-primary)', background: 'transparent',
            }}
          />
          {buscando && (
            <span style={{ fontSize: 12, color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>
              Buscando...
            </span>
          )}
          {busqueda && !buscando && (
            <button
              onClick={() => { setBusqueda(''); setMostrarDropdown(false); inputRef.current?.focus(); }}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', padding: '2px 4px', fontSize: 18, lineHeight: 1 }}
            >
              ✕
            </button>
          )}
        </div>

        {/* Dropdown resultados */}
        {mostrarDropdown && (
          <div
            style={{
              position: 'absolute', top: 'calc(100% + 6px)', left: 0, right: 0,
              background: 'white', border: '1px solid var(--border)',
              borderRadius: 12, boxShadow: '0 12px 32px rgba(0,0,0,0.12)',
              zIndex: 200, overflow: 'hidden', maxHeight: 340, overflowY: 'auto',
            }}
          >
            {resultados.length === 0 ? (
              <div style={{ padding: '20px 16px', textAlign: 'center', color: 'var(--text-secondary)', fontSize: 14 }}>
                No se encontraron productos para "{busqueda}"
              </div>
            ) : (
              resultados.map((producto) => {
                const enCarrito = carrito.some((i) => i.producto.id === producto.id);
                const sinStock = producto.stockActual === 0;
                const badge = CATEGORIA_BADGE[producto.categoria];

                return (
                  <button
                    key={producto.id}
                    onClick={() => !sinStock && agregarAlCarrito(producto)}
                    disabled={sinStock}
                    style={{
                      width: '100%', display: 'flex', alignItems: 'center', gap: 12,
                      padding: '12px 16px',
                      border: 'none', borderBottom: '1px solid var(--border)',
                      background: enCarrito ? '#f0fdf4' : 'white',
                      cursor: sinStock ? 'not-allowed' : 'pointer',
                      opacity: sinStock ? 0.55 : 1,
                      textAlign: 'left', fontFamily: 'inherit',
                      transition: 'background 0.1s',
                    }}
                    onMouseEnter={(e) => { if (!sinStock && !enCarrito) (e.currentTarget as HTMLElement).style.background = '#f9fafb'; }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = enCarrito ? '#f0fdf4' : 'white'; }}
                  >
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                        <span style={{ fontWeight: 500, fontSize: 14, color: 'var(--text-primary)' }}>
                          {producto.nombre}
                        </span>
                        <span style={{ background: badge.bg, color: badge.color, padding: '1px 7px', borderRadius: 20, fontSize: 11, fontWeight: 500 }}>
                          {badge.label}
                        </span>
                        {producto.tieneIva && (
                          <span style={{ background: '#fef9c3', color: '#854d0e', padding: '1px 7px', borderRadius: 20, fontSize: 11, fontWeight: 600 }}>
                            IVA {Number(producto.porcentajeIva)}%
                          </span>
                        )}
                        {enCarrito && (
                          <span style={{ background: '#dcfce7', color: '#166534', padding: '1px 7px', borderRadius: 20, fontSize: 11, fontWeight: 600 }}>
                            ✓ En carrito
                          </span>
                        )}
                      </div>
                      <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 3 }}>
                        {producto.sku}
                        <span style={{ margin: '0 6px' }}>·</span>
                        Stock: <strong style={{ color: producto.stockActual <= producto.stockMinimo ? 'var(--red)' : 'inherit' }}>{producto.stockActual}</strong> un.
                        {sinStock && <span style={{ color: 'var(--red)', fontWeight: 600, marginLeft: 8 }}>Sin stock</span>}
                      </div>
                    </div>
                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      <div style={{ fontWeight: 700, fontSize: 16, color: 'var(--text-primary)' }}>
                        ${formatPrecio(producto.precioVenta)}
                      </div>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        )}
      </div>

      {/* ── Tabla del carrito ─────────────────────────────────────────────────── */}
      <div
        style={{
          background: 'white',
          borderRadius: 12,
          border: '1px solid var(--border)',
          overflow: 'hidden',
          boxShadow: '0 1px 4px rgba(0,0,0,0.05)',
        }}
      >
        {/* Cabecera */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 110px 130px 150px 120px 48px',
            padding: '10px 20px',
            background: '#f9fafb',
            borderBottom: '1px solid var(--border)',
          }}
        >
          {['Producto', 'Categoría', 'Precio unit.', 'Cantidad', 'Subtotal', ''].map((col, i) => (
            <div
              key={i}
              style={{
                fontSize: 11, fontWeight: 700,
                color: 'var(--text-secondary)',
                textTransform: 'uppercase', letterSpacing: '0.06em',
                textAlign: i === 0 || i === 1 ? 'left' : 'right',
                paddingRight: i > 1 && i < 5 ? 8 : 0,
              }}
            >
              {col}
            </div>
          ))}
        </div>

        {/* Filas o estado vacío */}
        {carritoVacio ? (
          <div style={{ padding: '56px 24px', textAlign: 'center' }}>
            <div style={{ fontSize: 44, marginBottom: 12, opacity: 0.25 }}>🛒</div>
            <div style={{ fontSize: 15, fontWeight: 500, color: '#9ca3af' }}>El carrito está vacío</div>
            <div style={{ fontSize: 13, color: '#d1d5db', marginTop: 4 }}>
              Escribí en el buscador de arriba para agregar productos
            </div>
          </div>
        ) : (
          carrito.map((item) => (
            <FilaCarrito
              key={item.producto.id}
              item={item}
              onCambiarCantidad={cambiarCantidad}
              onQuitar={quitarDelCarrito}
            />
          ))
        )}

        {/* ── Selector de método de pago ────────────────────────────────────── */}
        {!carritoVacio && (
          <div
            style={{
              borderTop: '1px solid var(--border)',
              padding: '16px 24px',
              background: '#fafaf9',
            }}
          >
            <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>
              Método de pago {metodoPago === null && <span style={{ color: 'var(--red)', marginLeft: 4 }}>— requerido</span>}
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              {METODOS_PAGO.map(({ value, label, emoji }) => {
                const seleccionado = metodoPago === value;
                return (
                  <button
                    key={value}
                    onClick={() => setMetodoPago(value)}
                    style={{
                      flex: 1,
                      padding: '12px 8px',
                      border: `2px solid ${seleccionado ? 'var(--green)' : 'var(--border)'}`,
                      borderRadius: 10,
                      background: seleccionado ? '#f0fdf4' : 'white',
                      cursor: 'pointer',
                      fontFamily: 'inherit',
                      fontSize: 13,
                      fontWeight: 700,
                      color: seleccionado ? '#15803d' : 'var(--text-secondary)',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: 5,
                      transition: 'all 0.15s',
                      boxShadow: seleccionado ? '0 0 0 3px #dcfce7' : 'none',
                    }}
                  >
                    <span style={{ fontSize: 22 }}>{emoji}</span>
                    {label}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* ── Footer: error + total + botón ──────────────────────────────────── */}
        <div
          style={{
            borderTop: `2px solid ${hayErroresStock ? '#fca5a5' : 'var(--border)'}`,
            padding: '18px 24px',
            background: hayErroresStock ? '#fff5f5' : '#fafaf9',
            display: 'flex',
            alignItems: 'center',
            gap: 20,
          }}
        >
          {/* Alerta de stock insuficiente */}
          <div style={{ flex: 1 }}>
            {hayErroresStock && (
              <div
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 8,
                  background: '#fee2e2', border: '1px solid #fca5a5',
                  borderRadius: 8, padding: '8px 14px',
                  color: 'var(--red)', fontSize: 13, fontWeight: 500,
                }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                  <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
                </svg>
                Hay productos sin stock suficiente. Ajustá las cantidades para continuar.
              </div>
            )}
            {!hayErroresStock && !carritoVacio && metodoPago === null && (
              <div
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 8,
                  background: '#fff7ed', border: '1px solid #fed7aa',
                  borderRadius: 8, padding: '8px 14px',
                  color: '#92400e', fontSize: 13, fontWeight: 500,
                }}
              >
                Seleccioná un método de pago para continuar.
              </div>
            )}
          </div>

          {/* Cantidad de items + total */}
          {!carritoVacio && (
            <div style={{ textAlign: 'right', flexShrink: 0 }}>
              <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                {carrito.reduce((a, i) => a + i.cantidad, 0)} unidad{carrito.reduce((a, i) => a + i.cantidad, 0) !== 1 ? 'es' : ''} · {carrito.length} producto{carrito.length !== 1 ? 's' : ''}
              </div>
              {(ivaCalculado > 0 || recargoCredito > 0 || recargoTransferencia > 0) && (
                <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 2 }}>
                  {ivaCalculado > 0 && <span>IVA +${formatPrecio(ivaCalculado)}</span>}
                  {recargoCredito > 0 && <span style={{ marginLeft: 6 }}>Crédito +${formatPrecio(recargoCredito)}</span>}
                  {recargoTransferencia > 0 && <span style={{ marginLeft: 6 }}>Transf. +${formatPrecio(recargoTransferencia)}</span>}
                </div>
              )}
              <div style={{ fontSize: 30, fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.1, marginTop: 2 }}>
                ${formatPrecio(total)}
              </div>
            </div>
          )}

          {/* Botón revisar */}
          <button
            onClick={() => { setErrorServidor(null); setMostrarResumen(true); }}
            disabled={!puedeConfirmar}
            style={{
              padding: '13px 28px',
              background: puedeConfirmar ? 'var(--green)' : '#e5e7eb',
              color: puedeConfirmar ? 'white' : '#9ca3af',
              border: 'none', borderRadius: 10,
              fontSize: 15, fontWeight: 700, fontFamily: 'inherit',
              cursor: puedeConfirmar ? 'pointer' : 'not-allowed',
              transition: 'all 0.15s',
              minWidth: 180,
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              flexShrink: 0,
            }}
            onMouseEnter={(e) => { if (puedeConfirmar) (e.currentTarget as HTMLElement).style.background = '#15803d'; }}
            onMouseLeave={(e) => { if (puedeConfirmar) (e.currentTarget as HTMLElement).style.background = 'var(--green)'; }}
          >
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
              <circle cx="12" cy="12" r="3"/>
            </svg>
            Revisar y Confirmar
          </button>
        </div>
      </div>

      {/* Modal resumen de venta */}
      {mostrarResumen && (
        <div
          style={{
            position: 'fixed', inset: 0,
            background: 'rgba(15, 17, 23, 0.6)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 1000, backdropFilter: 'blur(2px)', padding: 20,
          }}
          onClick={() => { if (!confirmando) setMostrarResumen(false); }}
        >
          <div
            style={{
              background: 'white', borderRadius: 16,
              width: 520, maxWidth: '100%', maxHeight: '90vh',
              boxShadow: '0 24px 64px rgba(0,0,0,0.25)',
              display: 'flex', flexDirection: 'column',
              animation: 'slideUp 0.2s ease',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div style={{ padding: '22px 28px 18px', borderBottom: '1px solid var(--border)' }}>
              <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: 'var(--text-primary)' }}>
                Resumen de la venta
              </h2>
              <p style={{ margin: '4px 0 0', fontSize: 13, color: 'var(--text-secondary)' }}>
                Revisá los productos antes de confirmar
              </p>
            </div>

            {/* Lista de items */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '8px 0' }}>
              {/* Cabecera tabla resumen */}
              <div style={{
                display: 'grid', gridTemplateColumns: '1fr 60px 90px 90px',
                padding: '8px 28px',
                borderBottom: '1px solid var(--border)',
              }}>
                {['Producto', 'Cant.', 'Precio', 'Subtotal'].map((col, i) => (
                  <div key={i} style={{
                    fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)',
                    textTransform: 'uppercase', letterSpacing: '0.06em',
                    textAlign: i === 0 ? 'left' : 'right',
                  }}>{col}</div>
                ))}
              </div>
              {carrito.map((item) => {
                const subtotal = Number(item.producto.precioVenta) * item.cantidad;
                const badge = CATEGORIA_BADGE[item.producto.categoria];
                return (
                  <div key={item.producto.id} style={{
                    display: 'grid', gridTemplateColumns: '1fr 60px 90px 90px',
                    alignItems: 'center', padding: '13px 28px',
                    borderBottom: '1px solid var(--border)',
                  }}>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-primary)' }}>
                        {item.producto.nombre}
                      </div>
                      <div style={{ marginTop: 3 }}>
                        <span style={{ background: badge.bg, color: badge.color, padding: '1px 7px', borderRadius: 20, fontSize: 11, fontWeight: 500 }}>
                          {badge.label}
                        </span>
                      </div>
                    </div>
                    <div style={{ textAlign: 'right', fontSize: 14, fontWeight: 600, color: 'var(--text-secondary)' }}>
                      {item.cantidad}
                    </div>
                    <div style={{ textAlign: 'right', fontSize: 13, color: 'var(--text-secondary)' }}>
                      ${formatPrecio(item.producto.precioVenta)}
                    </div>
                    <div style={{ textAlign: 'right', fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>
                      ${formatPrecio(subtotal)}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Footer: total + error + botones */}
            <div style={{ borderTop: '2px solid var(--border)', padding: '18px 28px' }}>
                      {/* Desglose de importes */}
              <div style={{ background: '#f9fafb', borderRadius: 10, padding: '12px 16px', marginBottom: 16, border: '1px solid var(--border)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '5px 0' }}>
                  <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Subtotal</span>
                  <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>${formatPrecio(subtotalSinImpuestos)}</span>
                </div>
                {ivaCalculado > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '5px 0', borderTop: '1px dashed var(--border)' }}>
                    <span style={{ fontSize: 13, color: '#16a34a' }}>IVA (productos gravados)</span>
                    <span style={{ fontSize: 13, fontWeight: 600, color: '#16a34a' }}>+${formatPrecio(ivaCalculado)}</span>
                  </div>
                )}
                {recargoCredito > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '5px 0', borderTop: '1px dashed var(--border)' }}>
                    <span style={{ fontSize: 13, color: '#7c3aed' }}>Recargo crédito ({pctRecargoCredito}%)</span>
                    <span style={{ fontSize: 13, fontWeight: 600, color: '#7c3aed' }}>+${formatPrecio(recargoCredito)}</span>
                  </div>
                )}
                {recargoTransferencia > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '5px 0', borderTop: '1px dashed var(--border)' }}>
                    <span style={{ fontSize: 13, color: '#059669' }}>Recargo transf. ({pctRecargoTransferencia}%)</span>
                    <span style={{ fontSize: 13, fontWeight: 600, color: '#059669' }}>+${formatPrecio(recargoTransferencia)}</span>
                  </div>
                )}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 10, marginTop: 4, borderTop: '2px solid var(--border)' }}>
                  <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>
                    TOTAL
                    {metodoPago && (
                      <span style={{ marginLeft: 8, fontSize: 11, fontWeight: 600, background: '#f0fdf4', color: '#15803d', border: '1px solid #86efac', padding: '2px 8px', borderRadius: 20 }}>
                        {METODOS_PAGO.find((m) => m.value === metodoPago)?.emoji} {METODOS_PAGO.find((m) => m.value === metodoPago)?.label}
                      </span>
                    )}
                  </span>
                  <span style={{ fontSize: 28, fontWeight: 800, color: 'var(--text-primary)' }}>${formatPrecio(total)}</span>
                </div>
              </div>

              {/* Error servidor */}
              {errorServidor && (
                <div style={{
                  background: '#fee2e2', border: '1px solid #fca5a5',
                  borderRadius: 8, padding: '10px 14px',
                  color: 'var(--red)', fontSize: 13, fontWeight: 500,
                  marginBottom: 14,
                  display: 'flex', alignItems: 'flex-start', gap: 8,
                }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: 1 }}>
                    <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                  </svg>
                  {errorServidor}
                </div>
              )}

              {/* Botones */}
              <div style={{ display: 'flex', gap: 10 }}>
                <button
                  onClick={() => { setMostrarResumen(false); setErrorServidor(null); }}
                  disabled={confirmando}
                  style={{
                    flex: 1, padding: '12px',
                    border: '1.5px solid var(--border)', borderRadius: 10,
                    background: 'white', color: 'var(--text-secondary)',
                    fontSize: 14, fontWeight: 600, fontFamily: 'inherit',
                    cursor: confirmando ? 'not-allowed' : 'pointer',
                    opacity: confirmando ? 0.6 : 1,
                  }}
                >
                  Cancelar
                </button>
                <button
                  onClick={confirmarVenta}
                  disabled={!puedeConfirmar}
                  style={{
                    flex: 2, padding: '12px',
                    background: puedeConfirmar ? 'var(--green)' : '#e5e7eb',
                    color: puedeConfirmar ? 'white' : '#9ca3af',
                    border: 'none', borderRadius: 10,
                    fontSize: 15, fontWeight: 700, fontFamily: 'inherit',
                    cursor: puedeConfirmar ? 'pointer' : 'not-allowed',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                    transition: 'background 0.15s',
                  }}
                  onMouseEnter={(e) => { if (puedeConfirmar) (e.currentTarget as HTMLElement).style.background = '#15803d'; }}
                  onMouseLeave={(e) => { if (puedeConfirmar) (e.currentTarget as HTMLElement).style.background = 'var(--green)'; }}
                >
                  {confirmando ? (
                    <>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ animation: 'spin 1s linear infinite' }}>
                        <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
                      </svg>
                      Procesando...
                    </>
                  ) : (
                    <>
                      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12"/>
                      </svg>
                      Confirmar Venta
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de éxito */}
      {ventaExitosa && <ModalExito venta={ventaExitosa} onNuevaVenta={iniciarNuevaVenta} />}

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        input[type=number]::-webkit-inner-spin-button,
        input[type=number]::-webkit-outer-spin-button { -webkit-appearance: none; margin: 0; }
        input[type=number] { -moz-appearance: textfield; }
      `}</style>
    </div>
  );
}
