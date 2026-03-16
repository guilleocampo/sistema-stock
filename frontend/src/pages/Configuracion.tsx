import { useState, useEffect } from 'react';
import type { Categoria, ConfiguracionGanancia, ConfiguracionImpuesto } from '../types';
import { apiFetch } from '../services/api';

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

  // ── Estado de impuestos ───────────────────────────────────────────────────
  const [impuestos, setImpuestos] = useState<ConfiguracionImpuesto[]>([]);
  const [pctCredito, setPctCredito] = useState('8');
  const [guardandoCredito, setGuardandoCredito] = useState(false);
  const [exitoCredito, setExitoCredito] = useState('');

  const [pctTransferencia, setPctTransferencia] = useState('0');
  const [guardandoTransferencia, setGuardandoTransferencia] = useState(false);
  const [exitoTransferencia, setExitoTransferencia] = useState('');

  // IVA defaults por categoría (almacenados como ConfiguracionImpuesto tipo POR_PRODUCTO)
  const [ivaDefaults, setIvaDefaults] = useState<Record<Categoria, { activo: boolean; porcentaje: string }>>({
    QUIOSCO:   { activo: false, porcentaje: '21' },
    LIBRERIA:  { activo: false, porcentaje: '21' },
    REGALERIA: { activo: false, porcentaje: '21' },
  });
  const [guardandoIva, setGuardandoIva] = useState<Record<Categoria, boolean>>({
    QUIOSCO: false, LIBRERIA: false, REGALERIA: false,
  });
  const [exitoIva, setExitoIva] = useState<Record<Categoria, string>>({
    QUIOSCO: '', LIBRERIA: '', REGALERIA: '',
  });

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
    cargarImpuestos();
  }, []);

  async function cargarConfigs() {
    setCargando(true);
    setError(null);
    try {
      const json = await apiFetch<ConfiguracionGanancia[]>('/api/configuracion/ganancias');
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

  async function cargarImpuestos() {
    try {
      const json = await apiFetch<ConfiguracionImpuesto[]>('/api/configuracion/impuestos');
      const data: ConfiguracionImpuesto[] = json.data ?? [];
      setImpuestos(data);

      // Cargar recargo crédito
      const credito = data.find((i) => i.tipo === 'POR_METODO_PAGO' && i.metodoPago === 'CREDITO');
      if (credito) setPctCredito(String(Number(credito.porcentaje)));

      // Cargar recargo transferencia
      const transferencia = data.find((i) => i.tipo === 'POR_METODO_PAGO' && i.metodoPago === 'TRANSFERENCIA');
      if (transferencia) setPctTransferencia(String(Number(transferencia.porcentaje)));

      // Cargar defaults IVA por categoría
      const cats: Categoria[] = ['QUIOSCO', 'LIBRERIA', 'REGALERIA'];
      const nuevos = { ...ivaDefaults };
      cats.forEach((cat) => {
        const ivaCat = data.find((i) => i.tipo === 'POR_PRODUCTO' && i.nombre === `IVA ${cat}`);
        if (ivaCat) {
          nuevos[cat] = { activo: ivaCat.activo, porcentaje: String(Number(ivaCat.porcentaje)) };
        }
      });
      setIvaDefaults(nuevos);
    } catch {/* silencioso */}
  }

  async function guardarRecargoCredito() {
    setGuardandoCredito(true);
    try {
      const existing = impuestos.find((i) => i.tipo === 'POR_METODO_PAGO' && i.metodoPago === 'CREDITO');
      const pct = parseFloat(pctCredito) || 0;
      if (existing) {
        await apiFetch(`/api/configuracion/impuestos/${existing.id}`, {
          method: 'PUT',
          body: JSON.stringify({ porcentaje: pct, activo: true }),
        });
      } else {
        await apiFetch('/api/configuracion/impuestos', {
          method: 'POST',
          body: JSON.stringify({ nombre: 'Recargo Tarjeta de Crédito', porcentaje: pct, tipo: 'POR_METODO_PAGO', metodoPago: 'CREDITO' }),
        });
      }
      setExitoCredito('¡Guardado!');
      setTimeout(() => setExitoCredito(''), 3000);
      await cargarImpuestos();
    } catch {
      alert('Error al guardar');
    } finally {
      setGuardandoCredito(false);
    }
  }

  async function guardarRecargoTransferencia() {
    setGuardandoTransferencia(true);
    try {
      const existing = impuestos.find((i) => i.tipo === 'POR_METODO_PAGO' && i.metodoPago === 'TRANSFERENCIA');
      const pct = parseFloat(pctTransferencia) || 0;
      if (existing) {
        await apiFetch(`/api/configuracion/impuestos/${existing.id}`, {
          method: 'PUT',
          body: JSON.stringify({ porcentaje: pct, activo: true }),
        });
      } else {
        await apiFetch('/api/configuracion/impuestos', {
          method: 'POST',
          body: JSON.stringify({ nombre: 'Recargo Transferencia', porcentaje: pct, tipo: 'POR_METODO_PAGO', metodoPago: 'TRANSFERENCIA' }),
        });
      }
      setExitoTransferencia('¡Guardado!');
      setTimeout(() => setExitoTransferencia(''), 3000);
      await cargarImpuestos();
    } catch {
      alert('Error al guardar');
    } finally {
      setGuardandoTransferencia(false);
    }
  }

  async function guardarIvaCategoria(cat: Categoria) {
    setGuardandoIva((prev) => ({ ...prev, [cat]: true }));
    try {
      const existing = impuestos.find((i) => i.tipo === 'POR_PRODUCTO' && i.nombre === `IVA ${cat}`);
      const pct = parseFloat(ivaDefaults[cat].porcentaje) || 21;
      const activo = ivaDefaults[cat].activo;
      if (existing) {
        await apiFetch(`/api/configuracion/impuestos/${existing.id}`, {
          method: 'PUT',
          body: JSON.stringify({ porcentaje: pct, activo }),
        });
      } else {
        await apiFetch('/api/configuracion/impuestos', {
          method: 'POST',
          body: JSON.stringify({ nombre: `IVA ${cat}`, porcentaje: pct, tipo: 'POR_PRODUCTO', metodoPago: null }),
        });
      }
      setExitoIva((prev) => ({ ...prev, [cat]: '¡Guardado!' }));
      setTimeout(() => setExitoIva((prev) => ({ ...prev, [cat]: '' })), 3000);
      await cargarImpuestos();
    } catch {
      alert('Error al guardar');
    } finally {
      setGuardandoIva((prev) => ({ ...prev, [cat]: false }));
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
      await apiFetch('/api/configuracion/ganancias', {
        method: 'PUT',
        body: JSON.stringify({ categoria, porcentaje: parseFloat(porcentajes[categoria]) || 0 }),
      });
      setExito((prev) => ({ ...prev, [categoria]: '¡Precios actualizados correctamente!' }));
      setTimeout(() => setExito((prev) => ({ ...prev, [categoria]: '' })), 3500);
      await cargarConfigs();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Error de conexión con el servidor');
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

      {/* ── Sección Impuestos ─────────────────────────────────────────────── */}
      <div style={{ marginTop: 40 }}>
        <div style={{ marginBottom: 20 }}>
          <h2 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: 'var(--text-primary)' }}>
            Configuración de Impuestos
          </h2>
          <p style={{ margin: '6px 0 0', fontSize: 13, color: 'var(--text-secondary)' }}>
            Definí los recargos e IVA que se aplican en las ventas.
          </p>
        </div>

        {/* Card: Recargo Tarjeta de Crédito */}
        <div style={{
          background: 'white', borderRadius: 14, border: '1.5px solid var(--border)',
          overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', marginBottom: 20,
        }}>
          <div style={{
            padding: '16px 20px', background: '#f3e8ff',
            borderBottom: '2px solid #a855f7',
            display: 'flex', alignItems: 'center', gap: 12,
          }}>
            <span style={{ fontSize: 24 }}>💳</span>
            <div>
              <div style={{ fontSize: 16, fontWeight: 700, color: '#5b21b6' }}>Recargo Tarjeta de Crédito</div>
              <div style={{ fontSize: 11, color: '#7c3aed', marginTop: 1 }}>Se aplica al subtotal cuando el cliente paga con tarjeta de crédito</div>
            </div>
          </div>
          <div style={{ padding: '18px 20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
              <input
                type="number" min={0} max={100} step={0.5}
                value={pctCredito}
                onChange={(e) => setPctCredito(e.target.value)}
                style={{
                  width: 80, padding: '10px 12px',
                  border: '2px solid #c4b5fd', borderRadius: 8,
                  fontSize: 22, fontWeight: 800, fontFamily: 'inherit',
                  color: '#5b21b6', background: '#f3e8ff', outline: 'none',
                  textAlign: 'center',
                }}
              />
              <span style={{ fontSize: 22, fontWeight: 800, color: '#5b21b6' }}>%</span>
              <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                Ej: con 8% sobre $100 → se cobra $108
              </span>
            </div>
            {exitoCredito ? (
              <div style={{ background: '#dcfce7', border: '1px solid #86efac', borderRadius: 8, padding: '10px 14px', fontSize: 13, fontWeight: 600, color: '#15803d', textAlign: 'center' }}>
                ✓ {exitoCredito}
              </div>
            ) : (
              <button
                onClick={guardarRecargoCredito}
                disabled={guardandoCredito}
                style={{
                  padding: '10px 24px', background: '#a855f7', color: 'white',
                  border: 'none', borderRadius: 8, cursor: 'pointer',
                  fontFamily: 'inherit', fontSize: 14, fontWeight: 700,
                  opacity: guardandoCredito ? 0.6 : 1,
                }}
              >
                {guardandoCredito ? 'Guardando...' : 'Guardar recargo'}
              </button>
            )}
          </div>
        </div>

        {/* Card: Recargo por Transferencia */}
        <div style={{
          background: 'white', borderRadius: 14, border: '1.5px solid var(--border)',
          overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', marginBottom: 20,
        }}>
          <div style={{
            padding: '16px 20px', background: '#ecfdf5',
            borderBottom: '2px solid #10b981',
            display: 'flex', alignItems: 'center', gap: 12,
          }}>
            <span style={{ fontSize: 24 }}>📲</span>
            <div>
              <div style={{ fontSize: 16, fontWeight: 700, color: '#065f46' }}>Recargo por Transferencia</div>
              <div style={{ fontSize: 11, color: '#059669', marginTop: 1 }}>Se aplica al total cuando el cliente paga por transferencia</div>
            </div>
          </div>
          <div style={{ padding: '18px 20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
              <input
                type="number" min={0} max={100} step={0.5}
                value={pctTransferencia}
                onChange={(e) => setPctTransferencia(e.target.value)}
                style={{
                  width: 80, padding: '10px 12px',
                  border: '2px solid #6ee7b7', borderRadius: 8,
                  fontSize: 22, fontWeight: 800, fontFamily: 'inherit',
                  color: '#065f46', background: '#ecfdf5', outline: 'none',
                  textAlign: 'center',
                }}
              />
              <span style={{ fontSize: 22, fontWeight: 800, color: '#065f46' }}>%</span>
              <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                Ej: con 5% sobre $100 → se cobra $105
              </span>
            </div>
            {exitoTransferencia ? (
              <div style={{ background: '#dcfce7', border: '1px solid #86efac', borderRadius: 8, padding: '10px 14px', fontSize: 13, fontWeight: 600, color: '#15803d', textAlign: 'center' }}>
                ✓ {exitoTransferencia}
              </div>
            ) : (
              <button
                onClick={guardarRecargoTransferencia}
                disabled={guardandoTransferencia}
                style={{
                  padding: '10px 24px', background: '#10b981', color: 'white',
                  border: 'none', borderRadius: 8, cursor: 'pointer',
                  fontFamily: 'inherit', fontSize: 14, fontWeight: 700,
                  opacity: guardandoTransferencia ? 0.6 : 1,
                }}
              >
                {guardandoTransferencia ? 'Guardando...' : 'Guardar recargo'}
              </button>
            )}
          </div>
        </div>

        {/* IVA por categoría */}
        <div style={{ marginBottom: 8 }}>
          <h3 style={{ margin: '0 0 4px', fontSize: 16, fontWeight: 700, color: 'var(--text-primary)' }}>
            IVA por categoría
          </h3>
          <p style={{ margin: '0 0 14px', fontSize: 12, color: 'var(--text-secondary)' }}>
            Los productos nuevos de cada categoría heredarán este valor como default al crearlos.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
          {CATEGORIAS.map((cat) => {
            const info = CATEGORIA_INFO[cat];
            const ivaCat = ivaDefaults[cat];
            return (
              <div
                key={cat}
                style={{
                  background: 'white', borderRadius: 14,
                  border: `1.5px solid ${ivaCat.activo ? info.barra + '80' : 'var(--border)'}`,
                  overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
                }}
              >
                <div style={{
                  padding: '14px 18px', background: ivaCat.activo ? info.bg : '#f9fafb',
                  borderBottom: `2px solid ${ivaCat.activo ? info.barra : '#e5e7eb'}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ fontSize: 22 }}>{info.emoji}</span>
                    <span style={{ fontSize: 15, fontWeight: 700, color: ivaCat.activo ? info.color : 'var(--text-secondary)' }}>
                      {info.label}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIvaDefaults((prev) => ({ ...prev, [cat]: { ...prev[cat], activo: !prev[cat].activo } }))}
                    style={{
                      width: 40, height: 22, borderRadius: 11, border: 'none',
                      background: ivaCat.activo ? info.barra : '#d1d5db',
                      cursor: 'pointer', position: 'relative', transition: 'background 0.2s', flexShrink: 0,
                    }}
                  >
                    <span style={{
                      position: 'absolute', top: 2,
                      left: ivaCat.activo ? 20 : 3,
                      width: 16, height: 16, borderRadius: '50%',
                      background: 'white', transition: 'left 0.2s',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
                    }} />
                  </button>
                </div>
                <div style={{ padding: '14px 18px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12, opacity: ivaCat.activo ? 1 : 0.4 }}>
                    <input
                      type="number" min={0} max={100} step={0.5}
                      value={ivaCat.porcentaje}
                      disabled={!ivaCat.activo}
                      onChange={(e) => setIvaDefaults((prev) => ({ ...prev, [cat]: { ...prev[cat], porcentaje: e.target.value } }))}
                      style={{
                        width: 64, padding: '8px 10px',
                        border: `2px solid ${info.barra}40`, borderRadius: 7,
                        fontSize: 18, fontWeight: 800, fontFamily: 'inherit',
                        color: info.color, background: info.bg, outline: 'none', textAlign: 'center',
                      }}
                    />
                    <span style={{ fontSize: 18, fontWeight: 800, color: info.color }}>% IVA</span>
                  </div>
                  {exitoIva[cat] ? (
                    <div style={{ background: '#dcfce7', border: '1px solid #86efac', borderRadius: 7, padding: '8px 12px', fontSize: 12, fontWeight: 600, color: '#15803d', textAlign: 'center' }}>
                      ✓ {exitoIva[cat]}
                    </div>
                  ) : (
                    <button
                      onClick={() => guardarIvaCategoria(cat)}
                      disabled={guardandoIva[cat]}
                      style={{
                        width: '100%', padding: '9px',
                        background: info.barra, color: 'white',
                        border: 'none', borderRadius: 7,
                        cursor: 'pointer', fontFamily: 'inherit', fontSize: 13, fontWeight: 700,
                        opacity: guardandoIva[cat] ? 0.6 : 1,
                      }}
                    >
                      {guardandoIva[cat] ? 'Guardando...' : 'Guardar'}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
