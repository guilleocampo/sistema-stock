import { useState } from 'react';
import Sidebar, { type Pagina } from './components/layout/Sidebar';
import Header from './components/layout/Header';
import NuevaVenta from './pages/NuevaVenta';
import Productos from './pages/Productos';
import Proveedores from './pages/Proveedores';
import Reportes from './pages/Reportes';
import BajoStock from './pages/BajoStock';
import Configuracion from './pages/Configuracion';

const PAGINAS: Record<Pagina, React.ReactNode> = {
  'nueva-venta':   <NuevaVenta />,
  'productos':     <Productos />,
  'proveedores':   <Proveedores />,
  'reportes':      <Reportes />,
  'bajo-stock':    <BajoStock />,
  'configuracion': <Configuracion />,
};

export default function App() {
  const [pagina, setPagina] = useState<Pagina>('nueva-venta');

  return (
    <div
      style={{
        display: 'flex',
        minHeight: '100vh',
        background: 'var(--bg-main)',
      }}
    >
      {/* Sidebar fijo a la izquierda */}
      <Sidebar paginaActual={pagina} onNavegar={setPagina} />

      {/* Área principal */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          minWidth: 0,
          minHeight: '100vh',
        }}
      >
        <Header paginaActual={pagina} />

        <main
          style={{
            flex: 1,
            overflowY: 'auto',
          }}
        >
          {PAGINAS[pagina]}
        </main>
      </div>
    </div>
  );
}
