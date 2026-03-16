import { useBajoStock } from '../../hooks/useBajoStock';
import { useAuth } from '../../context/AuthContext';

export type Pagina = 'nueva-venta' | 'productos' | 'proveedores' | 'reportes' | 'bajo-stock' | 'configuracion';

interface Props {
  paginaActual: Pagina;
  onNavegar: (pagina: Pagina) => void;
}

interface NavItem {
  id: Pagina;
  label: string;
  icon: React.ReactNode;
  soloAdmin?: boolean;
}

function IconVenta() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>
      <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
    </svg>
  );
}

function IconProducto() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
    </svg>
  );
}

function IconProveedor() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
      <circle cx="9" cy="7" r="4"/>
      <path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
    </svg>
  );
}

function IconReporte() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/>
      <line x1="6" y1="20" x2="6" y2="14"/><line x1="2" y1="20" x2="22" y2="20"/>
    </svg>
  );
}

function IconAlerta() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
      <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
    </svg>
  );
}

function IconConfiguracion() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3"/>
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
    </svg>
  );
}

function IconLogo() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="3" width="20" height="14" rx="2"/>
      <line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/>
    </svg>
  );
}

function IconLogout() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
      <polyline points="16 17 21 12 16 7"/>
      <line x1="21" y1="12" x2="9" y2="12"/>
    </svg>
  );
}

const NAV_ITEMS: NavItem[] = [
  { id: 'nueva-venta',   label: 'Nueva Venta',   icon: <IconVenta /> },
  { id: 'productos',     label: 'Productos',      icon: <IconProducto />,    soloAdmin: true },
  { id: 'proveedores',   label: 'Proveedores',    icon: <IconProveedor />,   soloAdmin: true },
  { id: 'reportes',      label: 'Reportes',       icon: <IconReporte />,     soloAdmin: true },
  { id: 'bajo-stock',    label: 'Bajo Stock',     icon: <IconAlerta />,      soloAdmin: true },
  { id: 'configuracion', label: 'Configuración',  icon: <IconConfiguracion />, soloAdmin: true },
];

const ROL_LABEL: Record<string, string> = {
  ADMIN: 'Administrador',
  VENDEDOR: 'Vendedor',
};

export default function Sidebar({ paginaActual, onNavegar }: Props) {
  const cantidadBajoStock = useBajoStock();
  const { usuario, logout } = useAuth();
  const esAdmin = usuario?.rol === 'ADMIN';

  const itemsVisibles = NAV_ITEMS.filter((item) => !item.soloAdmin || esAdmin);

  return (
    <aside
      style={{
        width: 240,
        minHeight: '100vh',
        background: 'var(--sidebar-bg)',
        borderRight: '1px solid var(--sidebar-border)',
        display: 'flex',
        flexDirection: 'column',
        flexShrink: 0,
        position: 'sticky',
        top: 0,
        height: '100vh',
      }}
    >
      {/* Marca */}
      <div
        style={{
          padding: '24px 20px 20px',
          borderBottom: '1px solid var(--sidebar-border)',
          display: 'flex',
          alignItems: 'center',
          gap: 10,
        }}
      >
        <div
          style={{
            width: 36,
            height: 36,
            background: 'var(--green)',
            borderRadius: 8,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            flexShrink: 0,
          }}
        >
          <IconLogo />
        </div>
        <div>
          <div style={{ color: 'var(--text-sidebar-header)', fontWeight: 600, fontSize: 14, lineHeight: 1.2 }}>
            Sistema
          </div>
          <div style={{ color: 'var(--text-sidebar)', fontSize: 11, fontWeight: 400, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
            de Stock
          </div>
        </div>
      </div>

      {/* Categoría */}
      <div style={{ padding: '20px 20px 8px' }}>
        <span style={{ color: '#4b5563', fontSize: 10, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
          Menú
        </span>
      </div>

      {/* Navegación */}
      <nav style={{ flex: 1, padding: '0 12px' }}>
        {itemsVisibles.map((item) => {
          const activo = paginaActual === item.id;
          const esBajoStock = item.id === 'bajo-stock';

          return (
            <button
              key={item.id}
              onClick={() => onNavegar(item.id)}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '10px 12px',
                borderRadius: 8,
                border: 'none',
                cursor: 'pointer',
                marginBottom: 2,
                fontFamily: 'inherit',
                fontSize: 14,
                fontWeight: activo ? 600 : 400,
                textAlign: 'left',
                transition: 'all 0.15s ease',
                background: activo ? 'var(--sidebar-active-bg)' : 'transparent',
                color: activo
                  ? 'var(--text-sidebar-active)'
                  : esBajoStock && cantidadBajoStock > 0
                  ? '#f87171'
                  : 'var(--text-sidebar)',
                borderLeft: activo ? '2px solid var(--sidebar-active-border)' : '2px solid transparent',
                paddingLeft: activo ? 10 : 12,
              }}
              onMouseEnter={(e) => {
                if (!activo) (e.currentTarget as HTMLElement).style.background = 'var(--sidebar-item-hover)';
              }}
              onMouseLeave={(e) => {
                if (!activo) (e.currentTarget as HTMLElement).style.background = 'transparent';
              }}
            >
              <span style={{ opacity: activo ? 1 : 0.7, flexShrink: 0 }}>{item.icon}</span>
              <span style={{ flex: 1 }}>{item.label}</span>

              {esBajoStock && cantidadBajoStock > 0 && (
                <span
                  style={{
                    background: 'var(--red)',
                    color: '#fff',
                    fontSize: 11,
                    fontWeight: 700,
                    borderRadius: 20,
                    padding: '1px 7px',
                    minWidth: 20,
                    textAlign: 'center',
                    lineHeight: '18px',
                    flexShrink: 0,
                    animation: 'pulse 2s infinite',
                  }}
                >
                  {cantidadBajoStock}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Usuario logueado + cerrar sesión */}
      <div
        style={{
          padding: '12px 16px',
          borderTop: '1px solid var(--sidebar-border)',
          display: 'flex',
          flexDirection: 'column',
          gap: 10,
        }}
      >
        {/* Info del usuario */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            padding: '8px 10px',
            borderRadius: 8,
            background: 'rgba(0,0,0,0.15)',
          }}
        >
          <div
            style={{
              width: 30,
              height: 30,
              borderRadius: '50%',
              background: 'var(--green)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
              fontSize: 12,
              fontWeight: 700,
              flexShrink: 0,
              textTransform: 'uppercase',
            }}
          >
            {usuario?.username?.[0] ?? '?'}
          </div>
          <div style={{ minWidth: 0 }}>
            <div
              style={{
                color: 'var(--text-sidebar-header)',
                fontSize: 13,
                fontWeight: 600,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {usuario?.username}
            </div>
            <div style={{ color: 'var(--text-sidebar)', fontSize: 11 }}>
              {ROL_LABEL[usuario?.rol ?? ''] ?? usuario?.rol}
            </div>
          </div>
        </div>

        {/* Botón cerrar sesión */}
        <button
          onClick={logout}
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 7,
            padding: '8px 12px',
            borderRadius: 8,
            border: '1px solid rgba(239,68,68,0.25)',
            cursor: 'pointer',
            fontFamily: 'inherit',
            fontSize: 13,
            fontWeight: 500,
            color: '#f87171',
            background: 'transparent',
            transition: 'all 0.15s ease',
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLElement).style.background = 'rgba(239,68,68,0.1)';
            (e.currentTarget as HTMLElement).style.borderColor = 'rgba(239,68,68,0.5)';
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLElement).style.background = 'transparent';
            (e.currentTarget as HTMLElement).style.borderColor = 'rgba(239,68,68,0.25)';
          }}
        >
          <IconLogout />
          Cerrar sesión
        </button>

        <div style={{ color: '#374151', fontSize: 10, textAlign: 'center', letterSpacing: '0.03em' }}>
          Polirubro · v1.0
        </div>
      </div>
    </aside>
  );
}
