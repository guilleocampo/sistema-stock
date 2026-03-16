import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import productoRoutes from './routes/producto.routes';
import proveedorRoutes from './routes/proveedor.routes';
import ventaRoutes from './routes/venta.routes';
import movimientoRoutes from './routes/movimiento.routes';
import reporteRoutes from './routes/reporte.routes';
import configuracionRoutes from './routes/configuracion.routes';
import authRoutes from './routes/auth.routes';
import { verificarToken } from './middlewares/auth.middleware';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors({ origin: 'http://localhost:5173' }));
app.use(express.json());

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Ruta pública: login
app.use('/api/auth', authRoutes);

// Todas las demás rutas requieren JWT válido
app.use('/api/productos', verificarToken, productoRoutes);
app.use('/api/proveedores', verificarToken, proveedorRoutes);
app.use('/api/ventas', verificarToken, ventaRoutes);
app.use('/api/movimientos', verificarToken, movimientoRoutes);
app.use('/api/reportes', verificarToken, reporteRoutes);
app.use('/api/configuracion', verificarToken, configuracionRoutes);

app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
