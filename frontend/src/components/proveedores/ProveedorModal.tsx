import { useState, useEffect } from 'react';

interface Proveedor {
  id: number;
  nombre: string;
  telefono: string | null;
  email: string | null;
  notas: string | null;
}

interface FormData {
  nombre: string;
  telefono: string;
  email: string;
  notas: string;
}

interface Props {
  proveedor: Proveedor | null;
  onGuardar: (datos: Record<string, unknown>) => Promise<void>;
  onCerrar: () => void;
}

const VACIO: FormData = { nombre: '', telefono: '', email: '', notas: '' };

const inputStyle = (hasError?: boolean): React.CSSProperties => ({
  padding: '9px 12px',
  border: `1.5px solid ${hasError ? 'var(--red)' : 'var(--border)'}`,
  borderRadius: 8, fontSize: 14, fontFamily: 'inherit',
  color: 'var(--text-primary)', outline: 'none',
  background: 'white', width: '100%', boxSizing: 'border-box',
});

export default function ProveedorModal({ proveedor, onGuardar, onCerrar }: Props) {
  const esEdicion = proveedor !== null;
  const [form, setForm] = useState<FormData>(VACIO);
  const [errorNombre, setErrorNombre] = useState('');
  const [errorServidor, setErrorServidor] = useState('');
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    setForm(proveedor
      ? { nombre: proveedor.nombre, telefono: proveedor.telefono ?? '', email: proveedor.email ?? '', notas: proveedor.notas ?? '' }
      : VACIO
    );
    setErrorNombre('');
    setErrorServidor('');
  }, [proveedor]);

  const set = (campo: keyof FormData) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setForm((p) => ({ ...p, [campo]: e.target.value }));
    if (campo === 'nombre') setErrorNombre('');
    setErrorServidor('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.nombre.trim()) { setErrorNombre('El nombre es obligatorio'); return; }

    setGuardando(true);
    setErrorServidor('');
    try {
      await onGuardar({
        nombre: form.nombre.trim(),
        telefono: form.telefono.trim() || null,
        email: form.email.trim() || null,
        notas: form.notas.trim() || null,
      });
    } catch (err) {
      setErrorServidor(err instanceof Error ? err.message : 'Error al guardar');
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
        style={{ background: 'white', borderRadius: 16, width: 480, maxWidth: '100%', boxShadow: '0 24px 64px rgba(0,0,0,0.2)' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 24px 16px', borderBottom: '1px solid var(--border)' }}>
          <h2 style={{ margin: 0, fontSize: 17, fontWeight: 700 }}>{esEdicion ? 'Editar Proveedor' : 'Nuevo Proveedor'}</h2>
          <button onClick={onCerrar} style={{ width: 32, height: 32, border: 'none', borderRadius: 8, background: '#f3f4f6', cursor: 'pointer', fontSize: 18, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)' }}>✕</button>
        </div>

        <form onSubmit={handleSubmit} noValidate>
          <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 14 }}>

            {/* Nombre */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
              <label style={{ fontSize: 13, fontWeight: 600 }}>Nombre <span style={{ color: 'var(--red)' }}>*</span></label>
              <input style={inputStyle(!!errorNombre)} value={form.nombre} onChange={set('nombre')} placeholder="Ej: Distribuidora Norte" autoFocus />
              {errorNombre && <span style={{ fontSize: 12, color: 'var(--red)', fontWeight: 500 }}>{errorNombre}</span>}
            </div>

            {/* Teléfono + Email */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                <label style={{ fontSize: 13, fontWeight: 600 }}>Teléfono</label>
                <input style={inputStyle()} value={form.telefono} onChange={set('telefono')} placeholder="Ej: 3512345678" />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                <label style={{ fontSize: 13, fontWeight: 600 }}>Email</label>
                <input type="email" style={inputStyle()} value={form.email} onChange={set('email')} placeholder="proveedor@mail.com" />
              </div>
            </div>

            {/* Notas */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
              <label style={{ fontSize: 13, fontWeight: 600 }}>Notas</label>
              <textarea
                style={{ ...inputStyle(), resize: 'vertical', minHeight: 72, lineHeight: 1.5 }}
                value={form.notas}
                onChange={set('notas')}
                placeholder="Días de entrega, condiciones, observaciones..."
              />
            </div>

            {errorServidor && (
              <div style={{ background: '#fee2e2', border: '1px solid #fca5a5', borderRadius: 8, padding: '10px 14px', color: 'var(--red)', fontSize: 13, fontWeight: 500 }}>
                {errorServidor}
              </div>
            )}
          </div>

          <div style={{ padding: '14px 24px', borderTop: '1px solid var(--border)', display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
            <button type="button" onClick={onCerrar} style={{ padding: '9px 20px', border: '1.5px solid var(--border)', borderRadius: 8, background: 'white', cursor: 'pointer', fontSize: 14, fontWeight: 500, fontFamily: 'inherit', color: 'var(--text-secondary)' }}>
              Cancelar
            </button>
            <button type="submit" disabled={guardando} style={{ padding: '9px 22px', border: 'none', borderRadius: 8, background: guardando ? '#d1fae5' : 'var(--green)', color: 'white', cursor: guardando ? 'not-allowed' : 'pointer', fontSize: 14, fontWeight: 700, fontFamily: 'inherit' }}>
              {guardando ? 'Guardando...' : esEdicion ? 'Guardar cambios' : 'Crear proveedor'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
