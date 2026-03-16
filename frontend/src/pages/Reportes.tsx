import { useState, useEffect, useCallback } from 'react';
import type { Periodo, ResumenReporte, ProductoSinMovimiento, Categoria, HistorialPaginado, Venta } from '../types';
import { API_URL } from '../services/api';

// ── Constantes ─────────────────────────────────────────────────────────────────

const PERIODOS: { value: Exclude<Periodo, 'personalizado'>; label: string }[] = [
  { value: 'hoy',    label: 'Hoy' },
  { value: 'semana', label: 'Esta semana' },
  { value: 'mes',    label: 'Este mes' },
  { value: 'anio',   label: 'Este año' },
];

const CATEGORIA_INFO: Record<Categoria, { label: string; color: string; bg: string; barra: string }> = {
  QUIOSCO:   { label: 'Quiosco',   color: '#854d0e', bg: '#fef9c3', barra: '#eab308' },
  LIBRERIA:  { label: 'Librería',  color: '#1e3a8a', bg: '#dbeafe', barra: '#3b82f6' },
  REGALERIA: { label: 'Regalería', color: '#6b21a8', bg: '#f3e8ff', barra: '#a855f7' },
};

function formatPrecio(valor: number) {
  return valor.toLocaleString('es-AR', { minimumFractionDigits: 2 });
}

function formatFechaCorta(iso: string) {
  return new Date(iso).toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function formatFecha(iso: string) {
  return new Date(iso).toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function formatHora(iso: string) {
  return new Date(iso).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });
}

function hoy(): string {
  return new Date().toISOString().slice(0, 10);
}

// ── Sub-componentes ────────────────────────────────────────────────────────────

function TarjetaMetrica({
  icono, label, valor, sub, colorValor,
}: {
  icono: React.ReactNode; label: string; valor: string; sub?: string; colorValor?: string;
}) {
  return (
    <div style={{
      background: 'white', borderRadius: 12, border: '1px solid var(--border)',
      padding: '20px 24px', flex: 1,
      boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
    }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 12 }}>
        <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
          {label}
        </span>
        <span style={{ opacity: 0.35, fontSize: 20 }}>{icono}</span>
      </div>
      <div style={{ fontSize: 32, fontWeight: 800, color: colorValor ?? 'var(--text-primary)', lineHeight: 1, letterSpacing: '-0.5px' }}>
        {valor}
      </div>
      {sub && (
        <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 6 }}>{sub}</div>
      )}
    </div>
  );
}

function SeccionTitulo({ titulo, descripcion }: { titulo: string; descripcion?: string }) {
  return (
    <div style={{ marginBottom: 12 }}>
      <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: 'var(--text-primary)' }}>{titulo}</h3>
      {descripcion && <p style={{ margin: '3px 0 0', fontSize: 12, color: 'var(--text-secondary)' }}>{descripcion}</p>}
    </div>
  );
}

function Spinner() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '48px 0' }}>
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--green)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ animation: 'spin 0.9s linear infinite' }}>
        <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
      </svg>
      <style>{`@keyframes spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }`}</style>
    </div>
  );
}

// ── Fila expandible de historial ───────────────────────────────────────────────

function FilaVenta({ venta }: { venta: Venta }) {
  const [expandida, setExpandida] = useState(false);
  const totalProductos = venta.items.reduce((acc, i) => acc + i.cantidad, 0);
  const resumenProductos = venta.items
    .slice(0, 2)
    .map((i) => i.producto.nombre)
    .join(', ') + (venta.items.length > 2 ? ` +${venta.items.length - 2} más` : '');

  return (
    <>
      <div
        onClick={() => setExpandida(!expandida)}
        style={{
          display: 'grid',
          gridTemplateColumns: '110px 70px 80px 1fr 110px 36px',
          alignItems: 'center',
          padding: '11px 20px',
          borderBottom: '1px solid var(--border)',
          cursor: 'pointer',
          background: expandida ? '#f0fdf4' : 'white',
          transition: 'background 0.15s',
        }}
      >
        <div style={{ fontSize: 13, color: 'var(--text-primary)', fontWeight: 500 }}>
          {formatFecha(venta.fechaHora)}
        </div>
        <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
          {formatHora(venta.fechaHora)}
        </div>
        <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)' }}>
          #{venta.id}
        </div>
        <div style={{ fontSize: 12, color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', paddingRight: 12 }}>
          <span style={{ fontWeight: 600, color: 'var(--text-primary)', marginRight: 6 }}>
            {totalProductos} un.
          </span>
          {resumenProductos}
        </div>
        <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--green)', textAlign: 'right' }}>
          ${formatPrecio(Number(venta.total))}
        </div>
        <div style={{ textAlign: 'center', color: 'var(--text-secondary)', fontSize: 12, transition: 'transform 0.2s', transform: expandida ? 'rotate(180deg)' : 'rotate(0deg)' }}>
          ▾
        </div>
      </div>

      {expandida && (
        <div style={{
          background: '#f8fafc',
          borderBottom: '1px solid var(--border)',
          padding: '12px 20px 16px 36px',
        }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: '80px 1fr 70px 100px 100px 100px',
            padding: '6px 0',
            marginBottom: 4,
            borderBottom: '1px solid var(--border)',
          }}>
            {['SKU', 'Producto', 'Cant.', 'Precio unit.', 'Subtotal', 'Ganancia'].map((col, i) => (
              <div key={i} style={{
                fontSize: 10, fontWeight: 700, color: 'var(--text-secondary)',
                textTransform: 'uppercase', letterSpacing: '0.05em',
                textAlign: i >= 2 ? 'right' : 'left',
              }}>
                {col}
              </div>
            ))}
          </div>
          {venta.items.map((item) => {
            const catInfo = CATEGORIA_INFO[item.producto.categoria];
            const gananciaItem = (Number(item.precioUnitario) - Number(item.producto.precioCompra)) * item.cantidad;
            return (
              <div
                key={item.id}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '80px 1fr 70px 100px 100px 100px',
                  alignItems: 'center',
                  padding: '7px 0',
                  borderBottom: '1px solid #f1f5f9',
                }}
              >
                <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)' }}>
                  {item.producto.sku}
                </div>
                <div>
                  <div style={{ fontSize: 13, color: 'var(--text-primary)' }}>{item.producto.nombre}</div>
                  <span style={{ fontSize: 10, background: catInfo.bg, color: catInfo.color, padding: '1px 5px', borderRadius: 20, fontWeight: 600 }}>
                    {catInfo.label}
                  </span>
                </div>
                <div style={{ fontSize: 13, fontWeight: 600, textAlign: 'right', color: 'var(--text-primary)' }}>
                  {item.cantidad}
                </div>
                <div style={{ fontSize: 13, textAlign: 'right', color: 'var(--text-secondary)' }}>
                  ${formatPrecio(Number(item.precioUnitario))}
                </div>
                <div style={{ fontSize: 13, fontWeight: 700, textAlign: 'right', color: 'var(--text-primary)' }}>
                  ${formatPrecio(Number(item.subtotal))}
                </div>
                <div style={{ fontSize: 13, fontWeight: 700, textAlign: 'right', color: gananciaItem >= 0 ? '#7c3aed' : 'var(--red)' }}>
                  ${formatPrecio(gananciaItem)}
                </div>
              </div>
            );
          })}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 24, marginTop: 10, paddingTop: 8, borderTop: '2px solid var(--border)' }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: '#7c3aed' }}>
              Ganancia: ${formatPrecio(
                venta.items.reduce((acc, item) =>
                  acc + (Number(item.precioUnitario) - Number(item.producto.precioCompra)) * item.cantidad, 0
                )
              )}
            </span>
            <span style={{ fontSize: 14, fontWeight: 800, color: 'var(--green)' }}>
              Total: ${formatPrecio(Number(venta.total))}
            </span>
          </div>
        </div>
      )}
    </>
  );
}

// ── Componente principal ───────────────────────────────────────────────────────

export default function Reportes() {
  // ── Resumen ────────────────────────────────────────────────────────────────
  const [periodo, setPeriodo] = useState<Exclude<Periodo, 'personalizado'>>('hoy');
  const [desdeManual, setDesdeManual] = useState('');
  const [hastaManual, setHastaManual] = useState('');
  const usandoRangoManual = desdeManual !== '' && hastaManual !== '';

  const [resumen, setResumen] = useState<ResumenReporte | null>(null);
  const [sinMovimiento, setSinMovimiento] = useState<ProductoSinMovimiento[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ── Historial ──────────────────────────────────────────────────────────────
  const [historial, setHistorial] = useState<HistorialPaginado | null>(null);
  const [cargandoHistorial, setCargandoHistorial] = useState(false);
  const [paginaHistorial, setPaginaHistorial] = useState(1);

  // ── URL helpers ────────────────────────────────────────────────────────────
  function buildResumenUrl(): string {
    if (usandoRangoManual) {
      return `${API_URL}/api/reportes/resumen?desde=${desdeManual}&hasta=${hastaManual}`;
    }
    return `${API_URL}/api/reportes/resumen?periodo=${periodo}`;
  }

  function buildHistorialUrl(pagina: number): string {
    const params = new URLSearchParams({ pagina: String(pagina) });
    if (usandoRangoManual) {
      params.set('desde', desdeManual);
      params.set('hasta', hastaManual);
    } else {
      // Usar mismas fechas que el resumen
      if (resumen) {
        params.set('desde', resumen.desde.slice(0, 10));
        params.set('hasta', resumen.hasta.slice(0, 10));
      }
    }
    return `${API_URL}/api/ventas/historial?${params.toString()}`;
  }

  // ── Carga de resumen ───────────────────────────────────────────────────────
  const cargarResumen = useCallback(async (url: string) => {
    setCargando(true);
    setError(null);
    try {
      const [resRes, sinMov] = await Promise.all([
        fetch(url),
        fetch(`${API_URL}/api/reportes/productos-sin-movimiento?dias=30`),
      ]);
      const [resJson, sinMovJson] = await Promise.all([resRes.json(), sinMov.json()]);
      setResumen(resJson.data);
      setSinMovimiento(sinMovJson.data ?? []);
    } catch {
      setError('No se pudo cargar el reporte. Verificá que el backend esté corriendo.');
    } finally {
      setCargando(false);
    }
  }, []);

  // ── Carga de historial ─────────────────────────────────────────────────────
  const cargarHistorial = useCallback(async (url: string) => {
    setCargandoHistorial(true);
    try {
      const res = await fetch(url);
      const json = await res.json();
      setHistorial(json.data);
    } catch {
      // silencioso — el error principal ya se muestra arriba
    } finally {
      setCargandoHistorial(false);
    }
  }, []);

  // ── Efectos ────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (usandoRangoManual) {
      cargarResumen(buildResumenUrl());
    } else {
      cargarResumen(`${API_URL}/api/reportes/resumen?periodo=${periodo}`);
    }
    setPaginaHistorial(1);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [periodo, usandoRangoManual ? desdeManual : null, usandoRangoManual ? hastaManual : null]);

  // Cuando cambia el resumen o la página, recargar historial
  useEffect(() => {
    if (!resumen) return;
    cargarHistorial(buildHistorialUrl(paginaHistorial));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resumen, paginaHistorial]);

  // ── Handlers ───────────────────────────────────────────────────────────────
  function seleccionarPeriodo(p: Exclude<Periodo, 'personalizado'>) {
    setDesdeManual('');
    setHastaManual('');
    setPeriodo(p);
  }

  function cambiarPaginaHistorial(nueva: number) {
    setPaginaHistorial(nueva);
    window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
  }

  const sinVentas = resumen?.cantidadVentas === 0;
  const maxMonto = Math.max(...(resumen?.desgloseCategoria.map((d) => d.montoTotal) ?? [1]), 1);

  return (
    <div style={{ padding: '24px 28px', maxWidth: 1100, margin: '0 auto' }}>

      {/* ── Controles de período ──────────────────────────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap', marginBottom: 24 }}>

        {/* Botones rápidos */}
        <div
          style={{
            display: 'inline-flex', gap: 4,
            background: 'white', border: '1.5px solid var(--border)',
            borderRadius: 10, padding: 4,
          }}
        >
          {PERIODOS.map(({ value, label }) => (
            <button
              key={value}
              onClick={() => seleccionarPeriodo(value)}
              style={{
                padding: '8px 18px', border: 'none', borderRadius: 7,
                cursor: 'pointer', fontFamily: 'inherit', fontSize: 13, fontWeight: 600,
                transition: 'all 0.15s',
                background: !usandoRangoManual && periodo === value ? 'var(--sidebar-bg)' : 'transparent',
                color: !usandoRangoManual && periodo === value ? 'white' : 'var(--text-secondary)',
                opacity: usandoRangoManual ? 0.5 : 1,
              }}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Separador */}
        <div style={{ width: 1, height: 32, background: 'var(--border)', flexShrink: 0 }} />

        {/* Selector de rango manual */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>
            Rango:
          </span>
          <input
            type="date"
            value={desdeManual}
            max={hastaManual || hoy()}
            onChange={(e) => setDesdeManual(e.target.value)}
            style={{
              padding: '7px 10px', border: `1.5px solid ${usandoRangoManual ? 'var(--green)' : 'var(--border)'}`,
              borderRadius: 8, fontSize: 13, fontFamily: 'inherit',
              background: 'white', color: 'var(--text-primary)', cursor: 'pointer',
              outline: 'none',
            }}
          />
          <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>—</span>
          <input
            type="date"
            value={hastaManual}
            min={desdeManual || undefined}
            max={hoy()}
            onChange={(e) => setHastaManual(e.target.value)}
            style={{
              padding: '7px 10px', border: `1.5px solid ${usandoRangoManual ? 'var(--green)' : 'var(--border)'}`,
              borderRadius: 8, fontSize: 13, fontFamily: 'inherit',
              background: 'white', color: 'var(--text-primary)', cursor: 'pointer',
              outline: 'none',
            }}
          />
          {usandoRangoManual && (
            <button
              onClick={() => { setDesdeManual(''); setHastaManual(''); }}
              title="Limpiar rango"
              style={{
                background: 'none', border: 'none', cursor: 'pointer',
                color: 'var(--text-secondary)', fontSize: 16, lineHeight: 1, padding: '0 2px',
              }}
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* ── Rango activo ─────────────────────────────────────────────────── */}
      {resumen && !cargando && (
        <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 20, marginTop: -16 }}>
          {usandoRangoManual
            ? `Rango personalizado: ${formatFechaCorta(resumen.desde)} — ${formatFechaCorta(resumen.hasta)}`
            : `${formatFechaCorta(resumen.desde)} — ${formatFechaCorta(resumen.hasta)}`
          }
        </div>
      )}

      {error && (
        <div style={{ background: '#fee2e2', border: '1px solid #fca5a5', borderRadius: 10, padding: '14px 20px', color: 'var(--red)', fontSize: 14, marginBottom: 24 }}>
          {error}
        </div>
      )}

      {cargando ? <Spinner /> : (
        <>
          {/* ── Tarjetas de resumen ────────────────────────────────────── */}
          <div style={{ display: 'flex', gap: 14, marginBottom: 24 }}>
            <TarjetaMetrica
              icono="💰"
              label="Total vendido"
              valor={`$${formatPrecio(resumen?.totalRecaudado ?? 0)}`}
              colorValor={sinVentas ? 'var(--text-secondary)' : 'var(--green)'}
              sub={sinVentas ? 'Sin ventas en este período' : undefined}
            />
            <TarjetaMetrica
              icono="📈"
              label="Ganancia total"
              valor={`$${formatPrecio(resumen?.gananciaTotal ?? 0)}`}
              colorValor={sinVentas ? 'var(--text-secondary)' : '#7c3aed'}
              sub="Precio venta − precio costo"
            />
            <TarjetaMetrica
              icono="🧾"
              label="Ventas realizadas"
              valor={String(resumen?.cantidadVentas ?? 0)}
              sub={resumen?.cantidadVentas === 1 ? '1 transacción' : `${resumen?.cantidadVentas ?? 0} transacciones`}
            />
            <TarjetaMetrica
              icono="📊"
              label="Ticket promedio"
              valor={`$${formatPrecio(resumen?.ticketPromedio ?? 0)}`}
              sub="Por venta"
            />
          </div>

          {/* ── Fila: Top productos + Desglose categorías ─────────────── */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24 }}>

            {/* Top 5 productos */}
            <div style={{ background: 'white', borderRadius: 12, border: '1px solid var(--border)', padding: '20px 24px', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
              <SeccionTitulo
                titulo="Top 5 productos"
                descripcion="Por unidades vendidas en el período"
              />

              {sinVentas || (resumen?.topProductos.length ?? 0) === 0 ? (
                <div style={{ textAlign: 'center', padding: '32px 0', color: 'var(--text-secondary)', fontSize: 13 }}>
                  Sin ventas en este período
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  {resumen!.topProductos.map((item, i) => {
                    const catInfo = item.producto ? CATEGORIA_INFO[item.producto.categoria] : null;
                    return (
                      <div
                        key={i}
                        style={{
                          display: 'flex', alignItems: 'center', gap: 12,
                          padding: '9px 0',
                          borderBottom: i < resumen!.topProductos.length - 1 ? '1px solid var(--border)' : 'none',
                        }}
                      >
                        <div style={{
                          width: 26, height: 26, borderRadius: '50%', flexShrink: 0,
                          background: i === 0 ? '#fef9c3' : i === 1 ? '#f3f4f6' : i === 2 ? '#fef3c7' : '#f9fafb',
                          color: i === 0 ? '#854d0e' : '#6b7280',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: 12, fontWeight: 800,
                        }}>
                          {i + 1}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {item.producto?.nombre ?? '—'}
                          </div>
                          {catInfo && (
                            <span style={{ fontSize: 10, background: catInfo.bg, color: catInfo.color, padding: '1px 6px', borderRadius: 20, fontWeight: 600 }}>
                              {catInfo.label}
                            </span>
                          )}
                        </div>
                        <div style={{ textAlign: 'right', flexShrink: 0 }}>
                          <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>
                            {item.unidadesVendidas} un.
                          </div>
                          <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>
                            ${formatPrecio(item.montoTotal)}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Desglose por categoría */}
            <div style={{ background: 'white', borderRadius: 12, border: '1px solid var(--border)', padding: '20px 24px', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
              <SeccionTitulo
                titulo="Por categoría"
                descripcion="Total recaudado por rubro"
              />

              <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
                {resumen?.desgloseCategoria.map((cat) => {
                  const info = CATEGORIA_INFO[cat.categoria];
                  const porcentaje = maxMonto > 0 ? (cat.montoTotal / maxMonto) * 100 : 0;
                  return (
                    <div key={cat.categoria}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 6 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span style={{
                            width: 10, height: 10, borderRadius: '50%',
                            background: info.barra, flexShrink: 0, display: 'inline-block',
                          }} />
                          <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>
                            {info.label}
                          </span>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>
                            ${formatPrecio(cat.montoTotal)}
                          </span>
                          <span style={{ fontSize: 11, color: 'var(--text-secondary)', marginLeft: 8 }}>
                            {cat.unidadesVendidas} un.
                          </span>
                        </div>
                      </div>
                      <div style={{ height: 7, background: '#f3f4f6', borderRadius: 4, overflow: 'hidden' }}>
                        <div style={{
                          height: '100%', borderRadius: 4,
                          width: `${porcentaje}%`,
                          background: info.barra,
                          transition: 'width 0.5s ease',
                          minWidth: cat.montoTotal > 0 ? 6 : 0,
                        }} />
                      </div>
                    </div>
                  );
                })}
              </div>

              {sinVentas && (
                <div style={{ textAlign: 'center', paddingTop: 16, color: 'var(--text-secondary)', fontSize: 13 }}>
                  Sin ventas en este período
                </div>
              )}
            </div>
          </div>

          {/* ── Historial de ventas ────────────────────────────────────── */}
          <div style={{ background: 'white', borderRadius: 12, border: '1px solid var(--border)', overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.04)', marginBottom: 24 }}>
            <div style={{
              padding: '16px 20px', borderBottom: '1px solid var(--border)',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            }}>
              <div>
                <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: 'var(--text-primary)' }}>
                  Historial de ventas
                </h3>
                <p style={{ margin: '3px 0 0', fontSize: 12, color: 'var(--text-secondary)' }}>
                  {historial
                    ? `${historial.total} venta${historial.total !== 1 ? 's' : ''} en el período — hacé clic en una fila para ver el detalle`
                    : 'Hacé clic en una fila para ver el detalle'}
                </p>
              </div>
              {historial && historial.total > 0 && (
                <span style={{
                  background: '#dcfce7', color: '#15803d',
                  padding: '4px 12px', borderRadius: 20,
                  fontSize: 12, fontWeight: 700,
                }}>
                  {historial.total} ventas
                </span>
              )}
            </div>

            {cargandoHistorial ? (
              <Spinner />
            ) : !historial || historial.ventas.length === 0 ? (
              <div style={{ padding: '40px 24px', textAlign: 'center' }}>
                <div style={{ fontSize: 32, marginBottom: 10, opacity: 0.3 }}>🧾</div>
                <div style={{ fontSize: 14, fontWeight: 500, color: '#9ca3af' }}>
                  No hay ventas en este período
                </div>
              </div>
            ) : (
              <>
                {/* Cabecera tabla */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: '110px 70px 80px 1fr 110px 36px',
                  padding: '9px 20px',
                  background: '#f9fafb',
                  borderBottom: '1px solid var(--border)',
                }}>
                  {['Fecha', 'Hora', 'N° Venta', 'Productos', 'Total', ''].map((col, i) => (
                    <div key={i} style={{
                      fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)',
                      textTransform: 'uppercase', letterSpacing: '0.05em',
                      textAlign: i === 4 ? 'right' : 'left',
                    }}>
                      {col}
                    </div>
                  ))}
                </div>

                {historial.ventas.map((venta) => (
                  <FilaVenta key={venta.id} venta={venta} />
                ))}

                {/* Paginación */}
                {historial.totalPaginas > 1 && (
                  <div style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '12px 20px', borderTop: '1px solid var(--border)',
                    background: '#f9fafb',
                  }}>
                    <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                      Página {historial.pagina} de {historial.totalPaginas} ({historial.total} ventas)
                    </span>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button
                        onClick={() => cambiarPaginaHistorial(paginaHistorial - 1)}
                        disabled={paginaHistorial <= 1}
                        style={{
                          padding: '6px 14px', border: '1.5px solid var(--border)', borderRadius: 7,
                          background: 'white', cursor: paginaHistorial <= 1 ? 'not-allowed' : 'pointer',
                          fontSize: 13, fontWeight: 600, fontFamily: 'inherit',
                          color: paginaHistorial <= 1 ? 'var(--text-secondary)' : 'var(--text-primary)',
                          opacity: paginaHistorial <= 1 ? 0.4 : 1,
                        }}
                      >
                        ← Anterior
                      </button>
                      {/* Números de página (máx 5 visibles) */}
                      {Array.from({ length: historial.totalPaginas }, (_, i) => i + 1)
                        .filter((p) => Math.abs(p - paginaHistorial) <= 2)
                        .map((p) => (
                          <button
                            key={p}
                            onClick={() => cambiarPaginaHistorial(p)}
                            style={{
                              padding: '6px 12px', border: '1.5px solid var(--border)', borderRadius: 7,
                              background: p === paginaHistorial ? 'var(--sidebar-bg)' : 'white',
                              color: p === paginaHistorial ? 'white' : 'var(--text-primary)',
                              cursor: 'pointer', fontSize: 13, fontWeight: 600, fontFamily: 'inherit',
                            }}
                          >
                            {p}
                          </button>
                        ))}
                      <button
                        onClick={() => cambiarPaginaHistorial(paginaHistorial + 1)}
                        disabled={paginaHistorial >= historial.totalPaginas}
                        style={{
                          padding: '6px 14px', border: '1.5px solid var(--border)', borderRadius: 7,
                          background: 'white', cursor: paginaHistorial >= historial.totalPaginas ? 'not-allowed' : 'pointer',
                          fontSize: 13, fontWeight: 600, fontFamily: 'inherit',
                          color: paginaHistorial >= historial.totalPaginas ? 'var(--text-secondary)' : 'var(--text-primary)',
                          opacity: paginaHistorial >= historial.totalPaginas ? 0.4 : 1,
                        }}
                      >
                        Siguiente →
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          {/* ── Productos sin movimiento ───────────────────────────────── */}
          <div style={{ background: 'white', borderRadius: 12, border: '1px solid var(--border)', overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
            <div style={{
              padding: '16px 24px', borderBottom: '1px solid var(--border)',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            }}>
              <div>
                <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: 'var(--text-primary)' }}>
                  Productos sin movimiento
                </h3>
                <p style={{ margin: '3px 0 0', fontSize: 12, color: 'var(--text-secondary)' }}>
                  Sin ventas en los últimos 30 días
                </p>
              </div>
              {sinMovimiento.length > 0 && (
                <span style={{
                  background: '#fee2e2', color: '#991b1b',
                  padding: '4px 12px', borderRadius: 20,
                  fontSize: 12, fontWeight: 700,
                }}>
                  {sinMovimiento.length} producto{sinMovimiento.length !== 1 ? 's' : ''}
                </span>
              )}
            </div>

            {sinMovimiento.length === 0 ? (
              <div style={{ padding: '40px 24px', textAlign: 'center' }}>
                <div style={{ fontSize: 32, marginBottom: 10, opacity: 0.3 }}>✓</div>
                <div style={{ fontSize: 14, fontWeight: 500, color: '#9ca3af' }}>
                  Todos los productos tuvieron movimiento en los últimos 30 días
                </div>
              </div>
            ) : (
              <>
                <div style={{
                  display: 'grid', gridTemplateColumns: '80px 1fr 110px 90px 110px 130px',
                  padding: '9px 24px', background: '#f9fafb',
                  borderBottom: '1px solid var(--border)',
                }}>
                  {['SKU', 'Producto', 'Categoría', 'Stock', 'Días sin venta', 'Última venta'].map((col, i) => (
                    <div key={i} style={{
                      fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)',
                      textTransform: 'uppercase', letterSpacing: '0.05em',
                      textAlign: i >= 3 ? 'center' : 'left',
                    }}>
                      {col}
                    </div>
                  ))}
                </div>

                {sinMovimiento.map((p, idx) => {
                  const catInfo = CATEGORIA_INFO[p.categoria];
                  const esUltimo = idx === sinMovimiento.length - 1;
                  const nuncaVendido = p.diasSinVenta === null;
                  const critico = p.diasSinVenta !== null && p.diasSinVenta > 60;

                  return (
                    <div
                      key={p.id}
                      style={{
                        display: 'grid', gridTemplateColumns: '80px 1fr 110px 90px 110px 130px',
                        alignItems: 'center', padding: '11px 24px',
                        borderBottom: esUltimo ? 'none' : '1px solid var(--border)',
                        background: nuncaVendido ? '#fff5f5' : critico ? '#fffbeb' : 'white',
                      }}
                    >
                      <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)' }}>
                        {p.sku}
                      </div>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-primary)' }}>{p.nombre}</div>
                        {p.proveedor && (
                          <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>{p.proveedor.nombre}</div>
                        )}
                      </div>
                      <div>
                        <span style={{ background: catInfo.bg, color: catInfo.color, padding: '2px 7px', borderRadius: 20, fontSize: 11, fontWeight: 600 }}>
                          {catInfo.label}
                        </span>
                      </div>
                      <div style={{ textAlign: 'center' }}>
                        <span style={{
                          fontSize: 14, fontWeight: 700,
                          color: p.stockActual === 0 ? 'var(--red)' : p.stockActual <= p.stockMinimo ? '#854d0e' : 'var(--text-primary)',
                        }}>
                          {p.stockActual}
                        </span>
                        <span style={{ fontSize: 11, color: 'var(--text-secondary)', marginLeft: 2 }}>un.</span>
                      </div>
                      <div style={{ textAlign: 'center' }}>
                        {nuncaVendido ? (
                          <span style={{ background: '#fee2e2', color: '#991b1b', padding: '3px 8px', borderRadius: 20, fontSize: 11, fontWeight: 700 }}>
                            Nunca vendido
                          </span>
                        ) : (
                          <span style={{ fontWeight: 700, fontSize: 14, color: critico ? '#854d0e' : 'var(--text-primary)' }}>
                            {p.diasSinVenta}d
                          </span>
                        )}
                      </div>
                      <div style={{ textAlign: 'center', fontSize: 12, color: 'var(--text-secondary)' }}>
                        {p.ultimaVenta ? formatFechaCorta(p.ultimaVenta) : '—'}
                      </div>
                    </div>
                  );
                })}
              </>
            )}
          </div>
        </>
      )}
    </div>
  );
}
