import { useState, useEffect } from 'react';
import type { Categoria, ConfiguracionGanancia } from '../types';
import { API_URL } from '../services/api';

// ── Constantes ─────────────────────────────────────────────────────────────────

const CATEGORIAS: Categoria[] = ['QUIOSCO', 'LIBRERIA', 'REGALERIA'];

const CATEGORIA_INFO: Record<Categoria, { label: string; color: string; bg: string; barra: string; emoji: string }> = {
  QUIOSCO:   { label: 'Quiosco',   color: '#854d0e', bg: '#fef9c3', barra: '#ca8a04', emoji: '🍬' },
  LIBRERIA:  { label: 'Librería',  color: '#1e3a8a', bg: '#dbeafe', barra: '#2563eb', emoji: '📚' },
  REGALERIA: { label: 'Regalería', color: '#6b21a8', bg: '#f3e8ff', barra: '#9333ea', emoji: '🎁' },
};

function formatPrecio(valor: number) {
  return valor.toLocaleString('es-AR', { minimumFractionDigits: 2 });
}

function Spinner() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '80px 0' }}>
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--green)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ animation: 'spin 0.9s linear infinite' }}>
        <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
      </svg>
      <style>{`@keyframes spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }`}</style>
    </div>
  );
}

// ── Componente principal ───────────────────────────────────────────────────────

export default function Configuracion() {
  const [configs, setConfigs] = useState<ConfiguracionGanancia[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Porcentajes locales editables por categoría
  const [porcentajes, setPorcentajes] = useState<Record<Categoria, string>>({
    QUIOSCO: '0',
    LIBRERIA: '0',
    REGALERIA: '0',
  });

  // Estado de guardado por categoría
  const [guardando, setGuardando] = useState<Record<Categoria, boolean>>({
    QUIOSCO: false,
    LIBRERIA: false,
    REGALERIA: false,
  });

  // Categoría que está esperando confirmación
  const [confirmando, setConfirmando] = useState<Categoria | null>(null);

  // Mensajes de éxito temporales por categoría
  const [exito, setExito] = useState<Record<Categoria, string>>({
    QUIOSCO: '',
    LIBRERIA: '',
    REGALERIA: '',
  });

  useEffect(() => {
    cargarConfigs();
  }, []);

  async function cargarConfigs() {
    setCargando(true);
    setError(null);
    try {
      const res = await fetch(`${API_URL}/api/configuracion/ganancias`);
      const json = await res.json();
      const data: ConfiguracionGanancia[] = json.data ?? [];
      setConfigs(data);
      const nuevos: Record<Categoria, string> = { QUIOSCO: '0', LIBRERIA: '0', REGALERIA: '0' };
      data.forEach((c) => {
        nuevos[c.categoria] = String(c.porcentaje);
      });
      setPorcentajes(nuevos);
    } catch {
      setError('No se pudo cargar la configuración. Verificá que el backend esté corriendo.');
    } finally {
      setCargando(false);
    }
  }

  function getConfig(categoria: Categoria): ConfiguracionGanancia | undefined {
    return configs.find((c) => c.categoria === categoria);
  }

  function precioEjemploVenta(pct: string): string {
    const p = parseFloat(pct) || 0;
    return formatPrecio(100 + 100 * p / 100);
  }

  function handleClickGuardar(categoria: Categoria) {
    setConfirmando(categoria);
  }

  function handleCancelar() {
    setConfirmando(null);
  }

  async function handleConfirmar(categoria: Categoria) {
    setConfirmando(null);
    setGuardando((prev) => ({ ...prev, [categoria]: true }));
    try {
      const res = await fetch(`${API_URL}/api/configuracion/ganancias`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ categoria, porcentaje: parseFloat(porcentajes[categoria]) || 0 }),
      });
      const json = await res.json();
      if (!res.ok) {
        alert(json.error ?? 'Error al guardar');
        return;
      }
      setExito((prev) => ({ ...prev, [categoria]: '¡Precios actualizados correctamente!' }));
      setTimeout(() => setExito((prev) => ({ ...prev, [categoria]: '' })), 3500);
      await cargarConfigs();
    } catch {
      alert('Error de conexión con el servidor');
    } finally {
      setGuardando((prev) => ({ ...prev, [categoria]: false }));
    }
  }

  if (cargando) return <Spinner />;

  return (
    <div style={{ padding: '24px 28px', maxWidth: 960, margin: '0 auto' }}>

      {/* ── Encabezado ─────────────────────────────────────────────────────── */}
      <div style={{ marginBottom: 28 }}>
        <h2 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: 'var(--text-primary)' }}>
          Configuración de Ganancias por Categoría
        </h2>
        <p style={{ margin: '6px 0 0', fontSize: 13, color: 'var(--text-secondary)' }}>
          Definí el porcentaje de ganancia por rubro. Al guardar, se recalculan los precios de venta
          de todos los productos activos de esa categoría.
        </p>
      </div>

      {error && (
        <div style={{
          background: '#fee2e2', border: '1px solid #fca5a5', borderRadius: 10,
          padding: '14px 20px', color: 'var(--red)', fontSize: 14, marginBottom: 24,
        }}>
          {error}
        </div>
      )}

      {/* ── Tarjetas por categoría ─────────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
        {CATEGORIAS.map((categoria) => {
          const info = CATEGORIA_INFO[categoria];
          const config = getConfig(categoria);
          const cantProd = config?.cantidadProductos ?? 0;
          const pct = porcentajes[categoria];
          const pctNum = parseFloat(pct) || 0;
          const esConfirmando = confirmando === categoria;
          const mensajeExito = exito[categoria];

          return (
            <div
              key={categoria}
              style={{
                background: 'white',
                borderRadius: 14,
                border: '1.5px solid var(--border)',
                overflow: 'hidden',
                boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
              }}
            >
              {/* Cabecera de la tarjeta */}
              <div style={{
                padding: '16px 20px',
                background: info.bg,
                borderBottom: `2px solid ${info.barra}`,
                display: 'flex',
                alignItems: 'center',
                gap: 12,
              }}>
                <span style={{ fontSize: 26 }}>{info.emoji}</span>
                <div>
                  <div style={{ fontSize: 16, fontWeight: 700, color: info.color }}>
                    {info.label}
                  </div>
                  <div style={{ fontSize: 11, color: info.color, opacity: 0.75, marginTop: 1 }}>
                    {cantProd} producto{cantProd !== 1 ? 's' : ''} activo{cantProd !== 1 ? 's' : ''}
                  </div>
                </div>
              </div>

              {/* Cuerpo */}
              <div style={{ padding: '18px 20px' }}>

                {/* Campo % */}
                <div style={{ marginBottom: 14 }}>
                  <label style={{
                    fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)',
                    textTransform: 'uppercase', letterSpacing: '0.06em',
                    display: 'block', marginBottom: 6,
                  }}>
                    % de Ganancia
                  </label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <input
                      type="number"
                      min={0}
                      max={9999}
                      step={0.5}
                      value={pct}
                      onChange={(e) => setPorcentajes((prev) => ({ ...prev, [categoria]: e.target.value }))}
                      style={{
                        flex: 1,
                        padding: '10px 12px',
                        border: `2px solid ${info.barra}40`,
                        borderRadius: 8,
                        fontSize: 22,
                        fontWeight: 800,
                        fontFamily: 'inherit',
                        color: info.color,
                        background: info.bg,
                        outline: 'none',
                        transition: 'border-color 0.15s',
                      }}
                      onFocus={(e) => (e.target.style.borderColor = info.barra)}
                      onBlur={(e) => (e.target.style.borderColor = `${info.barra}40`)}
                    />
                    <span style={{ fontSize: 22, fontWeight: 800, color: info.color, flexShrink: 0 }}>
                      %
                    </span>
                  </div>
                </div>

                {/* Ejemplo en tiempo real */}
                <div style={{
                  background: '#f9fafb',
                  borderRadius: 8,
                  padding: '10px 14px',
                  marginBottom: 14,
                  border: '1px solid var(--border)',
                }}>
                  <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 5 }}>
                    Ejemplo de precio
                  </div>
                  <div style={{ fontSize: 13, color: 'var(--text-primary)' }}>
                    Costo{' '}
                    <span style={{ fontWeight: 700 }}>$100,00</span>
                    {' '}→ Venta{' '}
                    <span style={{ fontWeight: 800, color: info.color, fontSize: 16 }}>
                      ${precioEjemploVenta(pct)}
                    </span>
                  </div>
                  {pctNum > 0 && (
                    <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 3 }}>
                      Ganancia bruta: +${formatPrecio(pctNum)} por cada $100 de costo
                    </div>
                  )}
                  {pctNum === 0 && (
                    <div style={{ fontSize: 11, color: '#f59e0b', marginTop: 3 }}>
                      Sin margen — precio venta igual al costo
                    </div>
                  )}
                </div>

                {/* Botón / Confirmación / Éxito */}
                {mensajeExito ? (
                  <div style={{
                    background: '#dcfce7', border: '1px solid #86efac',
                    borderRadius: 8, padding: '10px 14px',
                    fontSize: 13, fontWeight: 600, color: '#15803d', textAlign: 'center',
                  }}>
                    ✓ {mensajeExito}
                  </div>
                ) : esConfirmando ? (
                  <div style={{
                    background: '#fff7ed', border: '1.5px solid #fed7aa',
                    borderRadius: 8, padding: '12px 14px',
                  }}>
                    <div style={{ fontSize: 12, fontWeight: 600, color: '#92400e', marginBottom: 10, lineHeight: 1.4 }}>
                      ⚠️ Esto actualizará el precio de venta de{' '}
                      <strong>{cantProd} producto{cantProd !== 1 ? 's' : ''}</strong>{' '}
                      de {info.label}
                    </div>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button
                        onClick={() => handleConfirmar(categoria)}
                        style={{
                          flex: 1, padding: '8px',
                          background: info.barra, color: 'white',
                          border: 'none', borderRadius: 7,
                          cursor: 'pointer', fontFamily: 'inherit',
                          fontSize: 13, fontWeight: 700,
                        }}
                      >
                        Confirmar
                      </button>
                      <button
                        onClick={handleCancelar}
                        style={{
                          flex: 1, padding: '8px',
                          background: 'white', color: 'var(--text-secondary)',
                          border: '1.5px solid var(--border)', borderRadius: 7,
                          cursor: 'pointer', fontFamily: 'inherit',
                          fontSize: 13, fontWeight: 600,
                        }}
                      >
                        Cancelar
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => handleClickGuardar(categoria)}
                    disabled={guardando[categoria] || cantProd === 0}
                    style={{
                      width: '100%', padding: '11px',
                      background: cantProd === 0 ? '#f3f4f6' : info.barra,
                      color: cantProd === 0 ? 'var(--text-secondary)' : 'white',
                      border: 'none', borderRadius: 8,
                      cursor: cantProd === 0 ? 'not-allowed' : 'pointer',
                      fontFamily: 'inherit', fontSize: 14, fontWeight: 700,
                      opacity: guardando[categoria] ? 0.6 : 1,
                      transition: 'opacity 0.15s',
                    }}
                  >
                    {guardando[categoria]
                      ? 'Guardando...'
                      : cantProd === 0
                      ? 'Sin productos activos'
                      : 'Guardar cambios'}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Nota informativa ──────────────────────────────────────────────── */}
      <div style={{
        marginTop: 24,
        padding: '14px 20px',
        background: '#f0f9ff',
        borderRadius: 10,
        border: '1px solid #bae6fd',
        fontSize: 13,
        color: '#0369a1',
        lineHeight: 1.6,
      }}>
        <strong>ℹ️ Fórmula aplicada:</strong>{' '}
        <code style={{ background: '#e0f2fe', padding: '2px 6px', borderRadius: 4 }}>
          precio_venta = precio_costo × (1 + porcentaje / 100)
        </code>
        <br />
        Cada cambio queda registrado en el historial de movimientos de stock como <em>AJUSTE_MANUAL</em>.
      </div>
    </div>
  );
}
