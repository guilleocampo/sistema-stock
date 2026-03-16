import { useEffect, useState } from 'react';
import type { Pagina } from './Sidebar';

const TITULOS: Record<Pagina, string> = {
  'nueva-venta':   'Nueva Venta',
  'productos':     'Productos',
  'proveedores':   'Proveedores',
  'reportes':      'Reportes',
  'bajo-stock':    'Bajo Stock',
  'configuracion': 'Configuración',
};

const DIAS = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
const MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];

function formatearFecha(date: Date): string {
  const dia = DIAS[date.getDay()];
  const numero = date.getDate();
  const mes = MESES[date.getMonth()];
  const anio = date.getFullYear();
  return `${dia} ${numero} de ${mes} de ${anio}`;
}

function formatearHora(date: Date): string {
  return date.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });
}

interface Props {
  paginaActual: Pagina;
}

export default function Header({ paginaActual }: Props) {
  const [ahora, setAhora] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setAhora(new Date()), 60_000);
    return () => clearInterval(timer);
  }, []);

  return (
    <header
      style={{
        height: 60,
        background: 'var(--bg-header)',
        borderBottom: '1px solid var(--border)',
        display: 'flex',
        alignItems: 'center',
        padding: '0 28px',
        gap: 16,
        position: 'sticky',
        top: 0,
        zIndex: 10,
      }}
    >
      {/* Título de la sección actual */}
      <h1
        style={{
          margin: 0,
          fontSize: 18,
          fontWeight: 600,
          color: 'var(--text-primary)',
          flex: 1,
        }}
      >
        {TITULOS[paginaActual]}
      </h1>

      {/* Fecha y hora */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 13, color: 'var(--text-primary)', fontWeight: 500 }}>
            {formatearFecha(ahora)}
          </div>
          <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 1 }}>
            {formatearHora(ahora)} hs
          </div>
        </div>

        {/* Separador */}
        <div style={{ width: 1, height: 32, background: 'var(--border)' }} />

        {/* Indicador de estado */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <div
            style={{
              width: 7,
              height: 7,
              borderRadius: '50%',
              background: 'var(--green-mid)',
              boxShadow: '0 0 0 2px #dcfce7',
            }}
          />
          <span style={{ fontSize: 12, color: 'var(--text-secondary)', fontWeight: 500 }}>
            En línea
          </span>
        </div>
      </div>
    </header>
  );
}
