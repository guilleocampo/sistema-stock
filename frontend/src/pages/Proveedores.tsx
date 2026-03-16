import { useState, useEffect } from 'react';
import { apiFetch } from '../services/api';
import ProveedorModal from '../components/proveedores/ProveedorModal';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import type { Producto, Categoria } from '../types';

// ── Tipos ──────────────────────────────────────────────────────────────────────

interface Proveedor {
  id: number;
  nombre: string;
  telefono: string | null;
  email: string | null;
  notas: string | null;
  activo: boolean;
}

interface ProveedorDetalle extends Proveedor {
  productos: Pick<Producto, 'id' | 'sku' | 'nombre' | 'categoria' | 'precioVenta' | 'stockActual' | 'stockMinimo'>[];
}

// ── Helpers ────────────────────────────────────────────────────────────────────

const CATEGORIA_BADGE: Record<Categoria, { bg: string; color: string; label: string }> = {
  QUIOSCO:   { bg: '#fef9c3', color: '#854d0e', label: 'Quiosco' },
  LIBRERIA:  { bg: '#dbeafe', color: '#1e3a8a', label: 'Librería' },
  REGALERIA: { bg: '#f3e8ff', color: '#6b21a8', label: 'Regalería' },
};

function IconChevron({ abajo }: { abajo: boolean }) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
      style={{ transition: 'transform 0.2s', transform: abajo ? 'rotate(180deg)' : 'rotate(0deg)' }}>
      <polyline points="6 9 12 15 18 9"/>
    </svg>
  );
}

function IconEditar() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
    </svg>
  );
}

function IconDesactivar() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/>
    </svg>
  );
}

function IconHabilitar() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/><polyline points="9 12 11 14 15 10"/>
    </svg>
  );
}

function ActionBtn({
  onClick, title, children, color,
}: { onClick: () => void; title: string; children: React.ReactNode; color: 'blue' | 'red' | 'green' }) {
  const colors = {
    blue:  { hover: '#eff6ff', border: '#93c5fd', text: '#1d4ed8' },
    red:   { hover: '#fff5f5', border: '#fca5a5', text: 'var(--red)' },
    green: { hover: '#f0fdf4', border: '#86efac', text: 'var(--green)' },
  };
  const c = colors[color];

  return (
    <button
      onClick={(e) => { e.stopPropagation(); onClick(); }}
      title={title}
      style={{ width: 28, height: 28, border: '1.5px solid var(--border)', borderRadius: 7, background: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)', transition: 'all 0.12s' }}
      onMouseEnter={(e) => { const el = e.currentTarget as HTMLElement; el.style.background = c.hover; el.style.borderColor = c.border; el.style.color = c.text; }}
      onMouseLeave={(e) => { const el = e.currentTarget as HTMLElement; el.style.background = 'white'; el.style.borderColor = 'var(--border)'; el.style.color = 'var(--text-secondary)'; }}
    >
      {children}
    </button>
  );
}

// ── Componente principal ───────────────────────────────────────────────────────

export default function Proveedores() {
  const [proveedores, setProveedores] = useState<Proveedor[]>([]);
  const [cargando, setCargando] = useState(true);
  const [expandido, setExpandido] = useState<number | null>(null);
  const [detalle, setDetalle] = useState<Record<number, ProveedorDetalle>>({});
  const [cargandoDetalle, setCargandoDetalle] = useState<number | null>(null);

  const [modalAbierto, setModalAbierto] = useState(false);
  const [editando, setEditando] = useState<Proveedor | null>(null);
  const [desactivando, setDesactivando] = useState<Proveedor | null>(null);
  const [procesando, setProcesando] = useState(false);

  // ── Carga ──────────────────────────────────────────────────────────────────

  const cargar = async () => {
    setCargando(true);
    try {
      const json = await apiFetch<Proveedor[]>('/api/proveedores');
      setProveedores(json.data ?? []);
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => { cargar(); }, []);

  // ── Expandir fila y cargar detalle ─────────────────────────────────────────

  const toggleExpandir = async (id: number) => {
    if (expandido === id) { setExpandido(null); return; }
    setExpandido(id);

    if (detalle[id]) return; // ya cargado

    setCargandoDetalle(id);
    try {
      const json = await apiFetch<ProveedorDetalle>(`/api/proveedores/${id}`);
      setDetalle((prev) => ({ ...prev, [id]: json.data }));
    } finally {
      setCargandoDetalle(null);
    }
  };

  // ── CRUD ──────────────────────────────────────────────────────────────────

  const guardar = async (datos: Record<string, unknown>) => {
    const path = editando ? `/api/proveedores/${editando.id}` : '/api/proveedores';
    const method = editando ? 'PUT' : 'POST';
    await apiFetch(path, { method, body: JSON.stringify(datos) });

    // Invalidar caché del detalle si estábamos editando
    if (editando) {
      setDetalle((prev) => { const next = { ...prev }; delete next[editando.id]; return next; });
    }
    await cargar();
    setModalAbierto(false);
    setEditando(null);
  };

  const confirmarDesactivar = async () => {
    if (!desactivando) return;
    setProcesando(true);
    try {
      await apiFetch(`/api/proveedores/${desactivando.id}`, {
        method: 'PUT',
        body: JSON.stringify({ activo: false }),
      });
      await cargar();
    } finally {
      setProcesando(false);
      setDesactivando(null);
    }
  };

  const activar = async (prov: Proveedor) => {
    await apiFetch(`/api/proveedores/${prov.id}`, {
      method: 'PUT',
      body: JSON.stringify({ activo: true }),
    });
    await cargar();
  };

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div style={{ padding: '24px 28px' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 10, padding: '10px 18px' }}>
            <span style={{ fontSize: 24, fontWeight: 800, color: 'var(--green)', lineHeight: 1 }}>{proveedores.filter(p => p.activo).length}</span>
            <div style={{ fontSize: 11, color: 'var(--green)', fontWeight: 600, marginTop: 1 }}>Proveedores activos</div>
          </div>
        </div>

        <button
          onClick={() => { setEditando(null); setModalAbierto(true); }}
          style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 20px', background: 'var(--green)', color: 'white', border: 'none', borderRadius: 9, fontSize: 14, fontWeight: 700, fontFamily: 'inherit', cursor: 'pointer', whiteSpace: 'nowrap' }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = '#15803d'; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'var(--green)'; }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          Nuevo Proveedor
        </button>
      </div>

      {/* Tabla */}
      <div style={{ background: 'white', borderRadius: 12, border: '1px solid var(--border)', overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>

        {/* Cabecera */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 140px 200px 80px 80px', padding: '10px 20px', background: '#f9fafb', borderBottom: '2px solid var(--border)' }}>
          {['Nombre', 'Teléfono', 'Email', 'Productos', 'Acciones'].map((col, i) => (
            <div key={i} style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.06em', textAlign: i >= 3 ? 'center' : 'left' }}>
              {col}
            </div>
          ))}
        </div>

        {cargando && (
          <div style={{ padding: '48px 24px', textAlign: 'center', color: 'var(--text-secondary)', fontSize: 14 }}>Cargando proveedores...</div>
        )}

        {!cargando && proveedores.length === 0 && (
          <div style={{ padding: '56px 24px', textAlign: 'center' }}>
            <div style={{ fontSize: 36, marginBottom: 10, opacity: 0.2 }}>👥</div>
            <div style={{ fontSize: 15, fontWeight: 500, color: '#9ca3af' }}>No hay proveedores cargados</div>
            <button onClick={() => { setEditando(null); setModalAbierto(true); }} style={{ marginTop: 14, padding: '9px 20px', background: 'var(--green)', color: 'white', border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 600, fontFamily: 'inherit', cursor: 'pointer' }}>
              + Agregar primer proveedor
            </button>
          </div>
        )}

        {!cargando && proveedores.map((prov, idx) => {
          const abierto = expandido === prov.id;
          const det = detalle[prov.id];
          const cargandoEste = cargandoDetalle === prov.id;

          return (
            <div key={prov.id}>
              {/* Fila del proveedor */}
              <div
                onClick={() => toggleExpandir(prov.id)}
                style={{
                  display: 'grid', gridTemplateColumns: '1fr 140px 200px 80px 80px',
                  alignItems: 'center', padding: '14px 20px',
                  borderBottom: (!abierto && idx < proveedores.length - 1) ? '1px solid var(--border)' : 'none',
                  cursor: 'pointer', transition: 'background 0.1s',
                  background: abierto ? '#f0fdf4' : 'white',
                }}
                onMouseEnter={(e) => { if (!abierto) (e.currentTarget as HTMLElement).style.background = '#f9fafb'; }}
                onMouseLeave={(e) => { if (!abierto) (e.currentTarget as HTMLElement).style.background = 'white'; }}
              >
                {/* Nombre + chevron */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 36, height: 36, borderRadius: 9, background: !prov.activo ? '#f3f4f6' : abierto ? 'var(--green)' : '#f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'background 0.15s', opacity: prov.activo ? 1 : 0.5 }}>
                    <span style={{ fontSize: 15, fontWeight: 800, color: abierto && prov.activo ? 'white' : '#6b7280' }}>
                      {prov.nombre.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontWeight: 600, fontSize: 14, color: prov.activo ? 'var(--text-primary)' : '#9ca3af' }}>{prov.nombre}</span>
                      {!prov.activo && (
                        <span style={{ fontSize: 10, fontWeight: 700, background: '#fee2e2', color: '#b91c1c', padding: '2px 7px', borderRadius: 20, letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                          Inactivo
                        </span>
                      )}
                    </div>
                    {prov.notas && <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 1, maxWidth: 280, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{prov.notas}</div>}
                  </div>
                  <span style={{ color: abierto ? 'var(--green)' : 'var(--text-secondary)', marginLeft: 4 }}>
                    <IconChevron abajo={abierto} />
                  </span>
                </div>

                {/* Teléfono */}
                <div style={{ fontSize: 13, color: prov.telefono ? 'var(--text-primary)' : 'var(--text-secondary)' }}>
                  {prov.telefono ?? '—'}
                </div>

                {/* Email */}
                <div style={{ fontSize: 13, color: prov.email ? 'var(--text-primary)' : 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {prov.email ?? '—'}
                </div>

                {/* Cantidad de productos */}
                <div style={{ textAlign: 'center' }}>
                  {det ? (
                    <span style={{ background: '#f0fdf4', color: 'var(--green)', padding: '3px 9px', borderRadius: 20, fontSize: 12, fontWeight: 700 }}>
                      {det.productos.length}
                    </span>
                  ) : (
                    <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>—</span>
                  )}
                </div>

                {/* Acciones */}
                <div style={{ display: 'flex', gap: 5, justifyContent: 'center' }}>
                  <ActionBtn onClick={() => { setEditando(prov); setModalAbierto(true); }} title="Editar" color="blue">
                    <IconEditar />
                  </ActionBtn>
                  {prov.activo ? (
                    <ActionBtn onClick={() => setDesactivando(prov)} title="Deshabilitar" color="red">
                      <IconDesactivar />
                    </ActionBtn>
                  ) : (
                    <ActionBtn onClick={() => activar(prov)} title="Habilitar" color="green">
                      <IconHabilitar />
                    </ActionBtn>
                  )}
                </div>
              </div>

              {/* Panel expandido: productos del proveedor */}
              {abierto && (
                <div style={{ borderBottom: idx < proveedores.length - 1 ? '1px solid var(--border)' : 'none', background: '#f8fffe' }}>
                  {cargandoEste ? (
                    <div style={{ padding: '20px 56px', fontSize: 13, color: 'var(--text-secondary)' }}>Cargando productos...</div>
                  ) : det && det.productos.length === 0 ? (
                    <div style={{ padding: '20px 56px', fontSize: 13, color: 'var(--text-secondary)' }}>
                      Este proveedor no tiene productos asociados aún.
                    </div>
                  ) : det ? (
                    <div style={{ padding: '12px 56px 16px' }}>
                      <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>
                        {det.productos.length} producto{det.productos.length !== 1 ? 's' : ''} asociado{det.productos.length !== 1 ? 's' : ''}
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                        {det.productos.map((prod) => {
                          const badge = CATEGORIA_BADGE[prod.categoria];
                          const sinStock = prod.stockActual === 0;
                          const bajoStock = prod.stockActual <= prod.stockMinimo && !sinStock;
                          return (
                            <div
                              key={prod.id}
                              style={{
                                display: 'grid', gridTemplateColumns: '80px 1fr 110px 100px 90px',
                                alignItems: 'center', padding: '8px 14px',
                                background: sinStock ? '#fff5f5' : bajoStock ? '#fefce8' : 'white',
                                borderRadius: 8, fontSize: 13,
                              }}
                            >
                              <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)' }}>{prod.sku}</span>
                              <span style={{ fontWeight: 500 }}>{prod.nombre}</span>
                              <span>
                                <span style={{ background: badge.bg, color: badge.color, padding: '1px 7px', borderRadius: 20, fontSize: 11, fontWeight: 600 }}>
                                  {badge.label}
                                </span>
                              </span>
                              <span style={{ fontWeight: 600 }}>${Number(prod.precioVenta).toLocaleString('es-AR', { minimumFractionDigits: 2 })}</span>
                              <span style={{ fontWeight: 700, color: sinStock ? 'var(--red)' : bajoStock ? '#854d0e' : 'var(--green)' }}>
                                {prod.stockActual} un.
                                {sinStock && <span style={{ fontSize: 10, marginLeft: 4 }}>⚠</span>}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ) : null}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Modales */}
      {modalAbierto && (
        <ProveedorModal
          proveedor={editando}
          onGuardar={guardar}
          onCerrar={() => { setModalAbierto(false); setEditando(null); }}
        />
      )}

      {desactivando && (
        <ConfirmDialog
          titulo="¿Deshabilitar proveedor?"
          mensaje={`"${desactivando.nombre}" quedará inactivo. Sus productos no se verán afectados.`}
          labelConfirmar="Sí, deshabilitar"
          peligroso
          cargando={procesando}
          onConfirmar={confirmarDesactivar}
          onCancelar={() => setDesactivando(null)}
        />
      )}
    </div>
  );
}
