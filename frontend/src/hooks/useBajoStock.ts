import { useEffect, useState } from 'react';

const API = 'http://localhost:3001';

export function useBajoStock() {
  const [cantidad, setCantidad] = useState(0);

  useEffect(() => {
    const fetchCantidad = () => {
      fetch(`${API}/api/productos/bajo-stock`)
        .then((r) => r.json())
        .then((json) => setCantidad(json.data?.length ?? 0))
        .catch(() => setCantidad(0));
    };

    fetchCantidad();
    // Re-verificar cada 2 minutos
    const intervalo = setInterval(fetchCantidad, 120_000);
    return () => clearInterval(intervalo);
  }, []);

  return cantidad;
}
