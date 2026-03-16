interface Props {
  titulo: string;
  mensaje: string;
  labelConfirmar?: string;
  peligroso?: boolean;
  cargando?: boolean;
  onConfirmar: () => void;
  onCancelar: () => void;
}

export default function ConfirmDialog({
  titulo,
  mensaje,
  labelConfirmar = 'Confirmar',
  peligroso = false,
  cargando = false,
  onConfirmar,
  onCancelar,
}: Props) {
  return (
    <div
      style={{
        position: 'fixed', inset: 0,
        background: 'rgba(15,17,23,0.55)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 1100,
        backdropFilter: 'blur(2px)',
      }}
      onClick={onCancelar}
    >
      <div
        style={{
          background: 'white', borderRadius: 14,
          padding: '28px 28px 24px',
          width: 380, maxWidth: '90vw',
          boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ marginBottom: 8, fontSize: 18, fontWeight: 700, color: 'var(--text-primary)' }}>
          {titulo}
        </div>
        <p style={{ margin: '0 0 24px', fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
          {mensaje}
        </p>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <button
            onClick={onCancelar}
            disabled={cargando}
            style={{
              padding: '9px 20px', border: '1.5px solid var(--border)',
              borderRadius: 8, background: 'white', cursor: 'pointer',
              fontSize: 14, fontWeight: 500, fontFamily: 'inherit',
              color: 'var(--text-secondary)',
            }}
          >
            Cancelar
          </button>
          <button
            onClick={onConfirmar}
            disabled={cargando}
            style={{
              padding: '9px 20px', border: 'none', borderRadius: 8,
              background: peligroso ? 'var(--red)' : 'var(--green)',
              color: 'white', cursor: cargando ? 'not-allowed' : 'pointer',
              fontSize: 14, fontWeight: 600, fontFamily: 'inherit',
              opacity: cargando ? 0.7 : 1,
            }}
          >
            {cargando ? 'Procesando...' : labelConfirmar}
          </button>
        </div>
      </div>
    </div>
  );
}
