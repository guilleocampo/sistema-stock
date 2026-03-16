import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import productoRoutes from './routes/producto.routes';
import proveedorRoutes from './routes/proveedor.routes';
import ventaRoutes from './routes/venta.routes';
import movimientoRoutes from './routes/movimiento.routes';
import reporteRoutes from './routes/reporte.routes';
import configuracionRoutes from './routes/configuracion.routes';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors({ origin: 'http://localhost:5173' }));
app.use(express.json());

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use('/api/productos', productoRoutes);
app.use('/api/proveedores', proveedorRoutes);
app.use('/api/ventas', ventaRoutes);
app.use('/api/movimientos', movimientoRoutes);
app.use('/api/reportes', reporteRoutes);
app.use('/api/configuracion', configuracionRoutes);

app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
