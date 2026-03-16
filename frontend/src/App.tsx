import { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './pages/Login';
import Sidebar, { type Pagina } from './components/layout/Sidebar';
import Header from './components/layout/Header';
import NuevaVenta from './pages/NuevaVenta';
import Productos from './pages/Productos';
import Proveedores from './pages/Proveedores';
import Reportes from './pages/Reportes';
import BajoStock from './pages/BajoStock';
import Configuracion from './pages/Configuracion';

const PAGINAS_ADMIN: Record<Pagina, React.ReactNode> = {
  'nueva-venta':   <NuevaVenta />,
  'productos':     <Productos />,
  'proveedores':   <Proveedores />,
  'reportes':      <Reportes />,
  'bajo-stock':    <BajoStock />,
  'configuracion': <Configuracion />,
};

const PAGINAS_VENDEDOR: Partial<Record<Pagina, React.ReactNode>> = {
  'nueva-venta': <NuevaVenta />,
};

function AppContent() {
  const { isAuthenticated, usuario } = useAuth();
  const [pagina, setPagina] = useState<Pagina>('nueva-venta');

  if (!isAuthenticated) {
    return <Login />;
  }

  const esVendedor = usuario?.rol === 'VENDEDOR';
  const paginasDisponibles = esVendedor ? PAGINAS_VENDEDOR : PAGINAS_ADMIN;

  // Si el rol vendedor tiene activa una página no permitida, forzar nueva-venta
  const paginaActiva: Pagina = paginasDisponibles[pagina] ? pagina : 'nueva-venta';

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg-main)' }}>
      <Sidebar paginaActual={paginaActiva} onNavegar={setPagina} />

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, minHeight: '100vh' }}>
        <Header paginaActual={paginaActiva} />
        <main style={{ flex: 1, overflowY: 'auto' }}>
          {paginasDisponibles[paginaActiva]}
        </main>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
