import { useState, useEffect } from 'react';
import type { Producto, Categoria } from '../../types';
import { API_URL } from '../../services/api';

interface Proveedor { id: number; nombre: string }

interface FormData {
  nombre: string;
  categoria: Categoria | '';
  precioCompra: string;
  precioVenta: string;
  stockActual: string;
  stockMinimo: string;
  proveedorId: string;
}

interface FormErrors {
  nombre?: string;
  categoria?: string;
  precioCompra?: string;
  precioVenta?: string;
  stockActual?: string;
  stockMinimo?: string;
}

interface Props {
  producto: Producto | null;
  onGuardar: (datos: Record<string, unknown>) => Promise<void>;
  onCerrar: () => void;
}

const CATEGORIAS: { value: Categoria; label: string }[] = [
  { value: 'QUIOSCO',   label: 'Quiosco' },
  { value: 'LIBRERIA',  label: 'Librería' },
  { value: 'REGALERIA', label: 'Regalería' },
];

const VACIO: FormData = {
  nombre: '', categoria: '', precioCompra: '',
  precioVenta: '', stockActual: '0', stockMinimo: '5', proveedorId: '',
};

function Field({
  label, error, required, children,
}: {
  label: string; error?: string; required?: boolean; children: React.ReactNode;
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
      <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>
        {label}{required && <span style={{ color: 'var(--red)', marginLeft: 3 }}>*</span>}
      </label>
      {children}
      {error && <span style={{ fontSize: 12, color: 'var(--red)', fontWeight: 500 }}>{error}</span>}
    </div>
  );
}

const inputStyle = (hasError?: boolean): React.CSSProperties => ({
  padding: '9px 12px',
  border: `1.5px solid ${hasError ? 'var(--red)' : 'var(--border)'}`,
  borderRadius: 8,
  fontSize: 14,
  fontFamily: 'inherit',
  color: 'var(--text-primary)',
  outline: 'none',
  background: 'white',
  width: '100%',
  boxSizing: 'border-box',
});

export default function ProductoModal({ producto, onGuardar, onCerrar }: Props) {
  const esEdicion = producto !== null;

  const [form, setForm] = useState<FormData>(VACIO);
  const [errores, setErrores] = useState<FormErrors>({});
  const [errorServidor, setErrorServidor] = useState<string | null>(null);
  const [guardando, setGuardando] = useState(false);
  const [proveedores, setProveedores] = useState<Proveedor[]>([]);

  // Inicializar form con datos del producto si es edición
  useEffect(() => {
    if (producto) {
      setForm({
        nombre: producto.nombre,
        categoria: producto.categoria,
        precioCompra: String(Number(producto.precioCompra)),
        precioVenta: String(Number(producto.precioVenta)),
        stockActual: String(producto.stockActual),
        stockMinimo: String(producto.stockMinimo),
        proveedorId: producto.proveedorId ? String(producto.proveedorId) : '',
      });
    } else {
      setForm(VACIO);
    }
  }, [producto]);

  // Cargar proveedores para el select
  useEffect(() => {
    fetch(`${API_URL}/api/proveedores`)
      .then((r) => r.json())
      .then((json) => setProveedores(json.data ?? []))
      .catch(() => setProveedores([]));
  }, []);

  const set = (campo: keyof FormData) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm((prev) => ({ ...prev, [campo]: e.target.value }));
    setErrores((prev) => ({ ...prev, [campo]: undefined }));
    setErrorServidor(null);
  };

  const validar = (): boolean => {
    const e: FormErrors = {};
    if (!form.nombre.trim()) e.nombre = 'El nombre es obligatorio';
    if (!form.categoria) e.categoria = 'Seleccioná una categoría';

    const compra = Number(form.precioCompra);
    const venta = Number(form.precioVenta);

    if (form.precioCompra === '' || isNaN(compra) || compra < 0)
      e.precioCompra = 'Ingresá un precio de compra válido (mayor o igual a 0)';
    if (form.precioVenta === '' || isNaN(venta) || venta < 0)
      e.precioVenta = 'Ingresá un precio de venta válido (mayor o igual a 0)';
    if (!e.precioCompra && !e.precioVenta && venta <= compra)
      e.precioVenta = 'El precio de venta debe ser mayor al precio de compra';

    const stockMin = Number(form.stockMinimo);
    if (form.stockMinimo === '' || isNaN(stockMin) || stockMin < 0)
      e.stockMinimo = 'El stock mínimo debe ser mayor o igual a 0';

    if (esEdicion) {
      const stockAct = Number(form.stockActual);
      if (form.stockActual === '' || isNaN(stockAct) || stockAct < 0)
        e.stockActual = 'El stock actual debe ser mayor o igual a 0';
    }

    setErrores(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validar()) return;

    setGuardando(true);
    setErrorServidor(null);

    const datos: Record<string, unknown> = {
      nombre: form.nombre.trim(),
      categoria: form.categoria,
      precioCompra: Number(form.precioCompra),
      precioVenta: Number(form.precioVenta),
      stockMinimo: Number(form.stockMinimo),
      proveedorId: form.proveedorId ? Number(form.proveedorId) : null,
    };

    if (!esEdicion) {
      datos.stockActual = Number(form.stockActual);
    } else {
      datos.stockActual = Number(form.stockActual);
    }

    try {
      await onGuardar(datos);
    } catch (err) {
      setErrorServidor(err instanceof Error ? err.message : 'Error al guardar el producto');
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div
      style={{
        position: 'fixed', inset: 0,
        background: 'rgba(15,17,23,0.55)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 1000,
        backdropFilter: 'blur(2px)',
        padding: '20px',
      }}
      onClick={onCerrar}
    >
      <div
        style={{
          background: 'white', borderRadius: 16,
          width: 540, maxWidth: '100%', maxHeight: '90vh',
          overflowY: 'auto',
          boxShadow: '0 24px 64px rgba(0,0,0,0.2)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header del modal */}
        <div
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '20px 24px 16px',
            borderBottom: '1px solid var(--border)',
            position: 'sticky', top: 0, background: 'white', zIndex: 1,
          }}
        >
          <div>
            <h2 style={{ margin: 0, fontSize: 17, fontWeight: 700, color: 'var(--text-primary)' }}>
              {esEdicion ? 'Editar Producto' : 'Nuevo Producto'}
            </h2>
            {esEdicion && (
              <span style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2, display: 'block' }}>
                {producto.sku}
              </span>
            )}
          </div>
          <button
            onClick={onCerrar}
            style={{
              width: 32, height: 32, border: 'none', borderRadius: 8,
              background: '#f3f4f6', cursor: 'pointer', fontSize: 18,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'var(--text-secondary)',
            }}
          >
            ✕
          </button>
        </div>

        {/* Formulario */}
        <form onSubmit={handleSubmit} noValidate>
          <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 16 }}>

            {/* Nombre */}
            <Field label="Nombre del producto" required error={errores.nombre}>
              <input
                style={inputStyle(!!errores.nombre)}
                value={form.nombre}
                onChange={set('nombre')}
                placeholder="Ej: Coca Cola 500ml"
                autoFocus
              />
            </Field>

            {/* Categoría */}
            <Field label="Categoría" required error={errores.categoria}>
              <select style={inputStyle(!!errores.categoria)} value={form.categoria} onChange={set('categoria')}>
                <option value="">Seleccioná una categoría...</option>
                {CATEGORIAS.map((c) => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </select>
            </Field>

            {/* Precios en fila */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <Field label="Precio de compra ($)" required error={errores.precioCompra}>
                <input
                  type="number" min="0" step="0.01"
                  style={inputStyle(!!errores.precioCompra)}
                  value={form.precioCompra}
                  onChange={set('precioCompra')}
                  placeholder="0.00"
                />
              </Field>
              <Field label="Precio de venta ($)" required error={errores.precioVenta}>
                <input
                  type="number" min="0" step="0.01"
                  style={inputStyle(!!errores.precioVenta)}
                  value={form.precioVenta}
                  onChange={set('precioVenta')}
                  placeholder="0.00"
                />
              </Field>
            </div>

            {/* Stocks en fila */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <Field
                label={esEdicion ? 'Stock actual' : 'Stock inicial'}
                error={errores.stockActual}
              >
                <input
                  type="number" min="0" step="1"
                  style={inputStyle(!!errores.stockActual)}
                  value={form.stockActual}
                  onChange={set('stockActual')}
                  placeholder="0"
                />
              </Field>
              <Field label="Stock mínimo (alerta)" error={errores.stockMinimo}>
                <input
                  type="number" min="0" step="1"
                  style={inputStyle(!!errores.stockMinimo)}
                  value={form.stockMinimo}
                  onChange={set('stockMinimo')}
                  placeholder="5"
                />
                <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>
                  Se mostrará alerta cuando el stock baje de este número
                </span>
              </Field>
            </div>

            {/* Proveedor */}
            <Field label="Proveedor (opcional)">
              <select style={inputStyle()} value={form.proveedorId} onChange={set('proveedorId')}>
                <option value="">Sin proveedor asignado</option>
                {proveedores.map((p) => (
                  <option key={p.id} value={p.id}>{p.nombre}</option>
                ))}
              </select>
            </Field>

            {/* Error del servidor */}
            {errorServidor && (
              <div
                style={{
                  background: '#fee2e2', border: '1px solid #fca5a5',
                  borderRadius: 8, padding: '10px 14px',
                  color: 'var(--red)', fontSize: 13, fontWeight: 500,
                  display: 'flex', alignItems: 'center', gap: 8,
                }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                </svg>
                {errorServidor}
              </div>
            )}
          </div>

          {/* Footer del modal */}
          <div
            style={{
              padding: '16px 24px',
              borderTop: '1px solid var(--border)',
              display: 'flex', gap: 10, justifyContent: 'flex-end',
              position: 'sticky', bottom: 0, background: 'white',
            }}
          >
            <button
              type="button"
              onClick={onCerrar}
              style={{
                padding: '10px 22px', border: '1.5px solid var(--border)',
                borderRadius: 9, background: 'white', cursor: 'pointer',
                fontSize: 14, fontWeight: 500, fontFamily: 'inherit',
                color: 'var(--text-secondary)',
              }}
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={guardando}
              style={{
                padding: '10px 24px', border: 'none', borderRadius: 9,
                background: guardando ? '#d1fae5' : 'var(--green)',
                color: 'white', cursor: guardando ? 'not-allowed' : 'pointer',
                fontSize: 14, fontWeight: 700, fontFamily: 'inherit',
                display: 'flex', alignItems: 'center', gap: 7,
              }}
            >
              {guardando ? (
                <>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ animation: 'spin 1s linear infinite' }}>
                    <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
                  </svg>
                  Guardando...
                </>
              ) : (
                <>{esEdicion ? 'Guardar cambios' : 'Crear producto'}</>
              )}
            </button>
          </div>
        </form>
      </div>
      <style>{`@keyframes spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }`}</style>
    </div>
  );
}
