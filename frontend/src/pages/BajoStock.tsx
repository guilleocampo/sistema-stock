import { useState, useEffect, useCallback } from 'react';
import type { Categoria } from '../types';
import { API_URL } from '../services/api';

// ── Tipos ──────────────────────────────────────────────────────────────────────

interface ProductoBajoStock {
  id: number;
  sku: string;
  nombre: string;
  categoria: Categoria;
  stockActual: number;
  stockMinimo: number;
  proveedor: { id: number; nombre: string; telefono: string | null; email: string | null } | null;
}

type MotivoEntrada = 'COMPRA' | 'DEVOLUCION';

// ── Helpers ────────────────────────────────────────────────────────────────────

const CATEGORIA_BADGE: Record<Categoria, { bg: string; color: string; label: string }> = {
  QUIOSCO:   { bg: '#fef9c3', color: '#854d0e', label: 'Quiosco' },
  LIBRERIA:  { bg: '#dbeafe', color: '#1e3a8a', label: 'Librería' },
  REGALERIA: { bg: '#f3e8ff', color: '#6b21a8', label: 'Regalería' },
};

// ── Modal de entrada de stock ──────────────────────────────────────────────────

function EntradaStockModal({
  producto,
  onConfirmar,
  onCerrar,
}: {
  producto: ProductoBajoStock;
  onConfirmar: (productoId: number, cantidad: number, motivo: MotivoEntrada) => Promise<void>;
  onCerrar: () => void;
}) {
  const [cantidad, setCantidad] = useState('');
  const [motivo, setMotivo] = useState<MotivoEntrada>('COMPRA');
  const [error, setError] = useState('');
  const [guardando, setGuardando] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cant = parseInt(cantidad, 10);
    if (!cantidad || isNaN(cant) || cant <= 0) {
      setError('Ingresá una cantidad válida mayor a 0');
      return;
    }
    setGuardando(true);
    try {
      await onConfirmar(producto.id, cant, motivo);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al registrar la entrada');
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div
      style={{ position: 'fixed', inset: 0, background: 'rgba(15,17,23,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, backdropFilter: 'blur(2px)', padding: 20 }}
      onClick={onCerrar}
    >
      <div
        style={{ background: 'white', borderRadius: 16, width: 420, maxWidth: '100%', boxShadow: '0 24px 64px rgba(0,0,0,0.2)' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ padding: '20px 24px 16px', borderBottom: '1px solid var(--border)' }}>
          <h3 style={{ margin: '0 0 4px', fontSize: 16, fontWeight: 700 }}>Registrar entrada de stock</h3>
          <p style={{ margin: 0, fontSize: 13, color: 'var(--text-secondary)' }}>
            {producto.nombre} · <span style={{ fontVariantNumeric: 'tabular-nums', fontWeight: 600 }}>{producto.sku}</span>
          </p>
        </div>

        <form onSubmit={handleSubmit} noValidate>
          <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 14 }}>

            {/* Info de stock actual */}
            <div style={{ background: producto.stockActual === 0 ? '#fff5f5' : '#fefce8', border: `1px solid ${producto.stockActual === 0 ? '#fca5a5' : '#fde047'}`, borderRadius: 8, padding: '10px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Stock actual</span>
              <span style={{ fontSize: 18, fontWeight: 800, color: producto.stockActual === 0 ? 'var(--red)' : '#854d0e' }}>
                {producto.stockActual} <span style={{ fontSize: 12, fontWeight: 400 }}>/ mín. {producto.stockMinimo}</span>
              </span>
            </div>

            {/* Motivo */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={{ fontSize: 13, fontWeight: 600 }}>Motivo de la entrada</label>
              <div style={{ display: 'flex', gap: 8 }}>
                {([['COMPRA', 'Compra a proveedor'], ['DEVOLUCION', 'Devolución']] as [MotivoEntrada, string][]).map(([val, label]) => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => setMotivo(val)}
                    style={{
                      flex: 1, padding: '9px 0', border: `2px solid ${motivo === val ? 'var(--green)' : 'var(--border)'}`,
                      borderRadius: 8, background: motivo === val ? '#f0fdf4' : 'white',
                      cursor: 'pointer', fontSize: 13, fontWeight: 600, fontFamily: 'inherit',
                      color: motivo === val ? 'var(--green)' : 'var(--text-secondary)',
                      transition: 'all 0.15s',
                    }}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Cantidad */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={{ fontSize: 13, fontWeight: 600 }}>
                Cantidad a ingresar <span style={{ color: 'var(--red)' }}>*</span>
              </label>
              <input
                type="number" min="1" autoFocus
                value={cantidad}
                onChange={(e) => { setCantidad(e.target.value); setError(''); }}
                placeholder="Ej: 24"
                style={{ padding: '10px 14px', border: `2px solid ${error ? 'var(--red)' : 'var(--border)'}`, borderRadius: 8, fontSize: 20, fontFamily: 'inherit', fontWeight: 700, textAlign: 'center', outline: 'none', color: 'var(--text-primary)' }}
              />
              {error && <span style={{ fontSize: 12, color: 'var(--red)', fontWeight: 500 }}>{error}</span>}
              {cantidad && !error && (
                <span style={{ fontSize: 12, color: 'var(--green)', fontWeight: 500 }}>
                  Stock resultante: {producto.stockActual + (parseInt(cantidad, 10) || 0)} unidades
                </span>
              )}
            </div>
          </div>

          <div style={{ padding: '14px 24px', borderTop: '1px solid var(--border)', display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
            <button type="button" onClick={onCerrar} style={{ padding: '9px 18px', border: '1.5px solid var(--border)', borderRadius: 8, background: 'white', cursor: 'pointer', fontSize: 14, fontWeight: 500, fontFamily: 'inherit', color: 'var(--text-secondary)' }}>
              Cancelar
            </button>
            <button type="submit" disabled={guardando} style={{ padding: '9px 22px', border: 'none', borderRadius: 8, background: guardando ? '#d1fae5' : 'var(--green)', color: 'white', cursor: guardando ? 'not-allowed' : 'pointer', fontSize: 14, fontWeight: 700, fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 7 }}>
              {guardando ? 'Registrando...' : '+ Registrar entrada'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Tarjeta de producto ────────────────────────────────────────────────────────

function TarjetaProducto({
  producto,
  onRegistrarEntrada,
}: {
  producto: ProductoBajoStock;
  onRegistrarEntrada: (p: ProductoBajoStock) => void;
}) {
  const badge = CATEGORIA_BADGE[producto.categoria];
  const critico = producto.stockActual === 0;

  return (
    <div style={{
      background: 'white',
      border: `1.5px solid ${critico ? '#fca5a5' : '#fde047'}`,
      borderRadius: 12,
      padding: '16px 18px',
      display: 'flex', flexDirection: 'column', gap: 12,
    }}>
      {/* Nombre + SKU + categoría */}
      <div>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
          <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--text-primary)', lineHeight: 1.3 }}>
            {producto.nombre}
          </div>
          <span style={{ background: badge.bg, color: badge.color, padding: '2px 8px', borderRadius: 20, fontSize: 11, fontWeight: 600, flexShrink: 0 }}>
            {badge.label}
          </span>
        </div>
        <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 3, fontWeight: 600 }}>
          {producto.sku}
        </div>
      </div>

      {/* Stock visual */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{
          flex: 1, height: 6, background: '#f3f4f6', borderRadius: 3, overflow: 'hidden',
        }}>
          <div style={{
            height: '100%', borderRadius: 3,
            width: producto.stockMinimo > 0 ? `${Math.min((producto.stockActual / producto.stockMinimo) * 100, 100)}%` : '0%',
            background: critico ? 'var(--red)' : '#f59e0b',
            transition: 'width 0.4s',
          }} />
        </div>
        <div style={{ textAlign: 'right', flexShrink: 0 }}>
          <span style={{ fontSize: 20, fontWeight: 800, color: critico ? 'var(--red)' : '#854d0e', lineHeight: 1 }}>
            {producto.stockActual}
          </span>
          <span style={{ fontSize: 11, color: 'var(--text-secondary)', marginLeft: 4 }}>
            / {producto.stockMinimo} min.
          </span>
        </div>
      </div>

      {/* Proveedor de contacto */}
      {producto.proveedor ? (
        <div style={{ background: '#f9fafb', borderRadius: 8, padding: '8px 12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: 11, color: 'var(--text-secondary)', fontWeight: 500, marginBottom: 2 }}>PROVEEDOR</div>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{producto.proveedor.nombre}</div>
            {producto.proveedor.telefono && (
              <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 1 }}>
                📞 {producto.proveedor.telefono}
              </div>
            )}
          </div>
        </div>
      ) : (
        <div style={{ background: '#f9fafb', borderRadius: 8, padding: '8px 12px', fontSize: 12, color: '#9ca3af' }}>
          Sin proveedor asignado
        </div>
      )}

      {/* Botón entrada */}
      <button
        onClick={() => onRegistrarEntrada(producto)}
        style={{
          width: '100%', padding: '9px', border: `1.5px solid ${critico ? 'var(--red)' : '#f59e0b'}`,
          borderRadius: 8, background: critico ? '#fff5f5' : '#fffbeb',
          color: critico ? 'var(--red)' : '#92400e',
          cursor: 'pointer', fontSize: 13, fontWeight: 700, fontFamily: 'inherit',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
          transition: 'all 0.15s',
        }}
        onMouseEnter={(e) => {
          const el = e.currentTarget as HTMLElement;
          el.style.background = critico ? 'var(--red)' : '#f59e0b';
          el.style.color = 'white';
          el.style.borderColor = 'transparent';
        }}
        onMouseLeave={(e) => {
          const el = e.currentTarget as HTMLElement;
          el.style.background = critico ? '#fff5f5' : '#fffbeb';
          el.style.color = critico ? 'var(--red)' : '#92400e';
          el.style.borderColor = critico ? 'var(--red)' : '#f59e0b';
        }}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
        </svg>
        Registrar entrada
      </button>
    </div>
  );
}

// ── Componente principal ───────────────────────────────────────────────────────

export default function BajoStock() {
  const [productos, setProductos] = useState<ProductoBajoStock[]>([]);
  const [cargando, setCargando] = useState(true);
  const [modalProducto, setModalProducto] = useState<ProductoBajoStock | null>(null);
  const [exitoId, setExitoId] = useState<number | null>(null);

  const cargar = useCallback(async () => {
    setCargando(true);
    try {
      const res = await fetch(`${API_URL}/api/productos/bajo-stock`);
      const json = await res.json();
      setProductos(json.data ?? []);
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => { cargar(); }, [cargar]);

  const registrarEntrada = async (productoId: number, cantidad: number, motivo: MotivoEntrada) => {
    const res = await fetch(`${API_URL}/api/movimientos`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ productoId, tipo: 'ENTRADA', motivo, cantidad }),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error ?? 'Error al registrar');

    setModalProducto(null);
    setExitoId(productoId);
    setTimeout(() => setExitoId(null), 2500);
    await cargar();
  };

  const criticos = productos.filter((p) => p.stockActual === 0);
  const enAlerta = productos.filter((p) => p.stockActual > 0);

  if (cargando) {
    return (
      <div style={{ padding: '48px 28px', textAlign: 'center', color: 'var(--text-secondary)', fontSize: 14 }}>
        Verificando stock...
      </div>
    );
  }

  if (productos.length === 0) {
    return (
      <div style={{ padding: '24px 28px', display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: 72, height: 72, borderRadius: '50%', background: '#dcfce7', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', fontSize: 36 }}>✓</div>
          <h2 style={{ margin: '0 0 8px', fontSize: 20, fontWeight: 700, color: 'var(--text-primary)' }}>¡Todo en orden!</h2>
          <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: 14 }}>
            Todos los productos tienen stock por encima del mínimo.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: '24px 28px' }}>

      {/* Resumen */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 28 }}>
        {criticos.length > 0 && (
          <div style={{ background: '#fff5f5', border: '1px solid #fca5a5', borderRadius: 10, padding: '12px 20px' }}>
            <div style={{ fontSize: 28, fontWeight: 800, color: 'var(--red)', lineHeight: 1 }}>{criticos.length}</div>
            <div style={{ fontSize: 11, color: 'var(--red)', fontWeight: 600, marginTop: 2 }}>SIN STOCK</div>
          </div>
        )}
        {enAlerta.length > 0 && (
          <div style={{ background: '#fffbeb', border: '1px solid #fde047', borderRadius: 10, padding: '12px 20px' }}>
            <div style={{ fontSize: 28, fontWeight: 800, color: '#854d0e', lineHeight: 1 }}>{enAlerta.length}</div>
            <div style={{ fontSize: 11, color: '#854d0e', fontWeight: 600, marginTop: 2 }}>STOCK BAJO</div>
          </div>
        )}
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
          <button
            onClick={cargar}
            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', border: '1.5px solid var(--border)', borderRadius: 8, background: 'white', cursor: 'pointer', fontSize: 13, fontFamily: 'inherit', color: 'var(--text-secondary)' }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
            </svg>
            Actualizar
          </button>
        </div>
      </div>

      {/* CRÍTICOS */}
      {criticos.length > 0 && (
        <div style={{ marginBottom: 32 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
            <div style={{ width: 10, height: 10, borderRadius: '50%', background: 'var(--red)', flexShrink: 0 }} />
            <h2 style={{ margin: 0, fontSize: 15, fontWeight: 800, color: 'var(--red)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Crítico — Sin stock
            </h2>
            <span style={{ background: '#fee2e2', color: '#991b1b', padding: '2px 10px', borderRadius: 20, fontSize: 12, fontWeight: 700 }}>
              {criticos.length}
            </span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 14 }}>
            {criticos.map((p) => (
              <div key={p.id} style={{ position: 'relative' }}>
                {exitoId === p.id && (
                  <div style={{ position: 'absolute', inset: 0, borderRadius: 12, background: '#f0fdf4', border: '2px solid var(--green)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1, fontSize: 24, fontWeight: 700, color: 'var(--green)' }}>
                    ✓ ¡Entrada registrada!
                  </div>
                )}
                <TarjetaProducto producto={p} onRegistrarEntrada={setModalProducto} />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* EN ALERTA */}
      {enAlerta.length > 0 && (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
            <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#f59e0b', flexShrink: 0 }} />
            <h2 style={{ margin: 0, fontSize: 15, fontWeight: 800, color: '#854d0e', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              En alerta — Stock bajo
            </h2>
            <span style={{ background: '#fef9c3', color: '#854d0e', padding: '2px 10px', borderRadius: 20, fontSize: 12, fontWeight: 700 }}>
              {enAlerta.length}
            </span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 14 }}>
            {enAlerta.map((p) => (
              <div key={p.id} style={{ position: 'relative' }}>
                {exitoId === p.id && (
                  <div style={{ position: 'absolute', inset: 0, borderRadius: 12, background: '#f0fdf4', border: '2px solid var(--green)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1, fontSize: 24, fontWeight: 700, color: 'var(--green)' }}>
                    ✓ ¡Entrada registrada!
                  </div>
                )}
                <TarjetaProducto producto={p} onRegistrarEntrada={setModalProducto} />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modal entrada de stock */}
      {modalProducto && (
        <EntradaStockModal
          producto={modalProducto}
          onConfirmar={registrarEntrada}
          onCerrar={() => setModalProducto(null)}
        />
      )}
    </div>
  );
}
