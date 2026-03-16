import { Router } from 'express';
import * as reporteController from '../controllers/reporte.controller';

const router = Router();

router.get('/resumen', reporteController.resumen);
router.get('/productos-sin-movimiento', reporteController.productosSinMovimiento);

export default router;
