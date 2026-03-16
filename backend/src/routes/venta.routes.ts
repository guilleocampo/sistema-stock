import { Router } from 'express';
import * as ventaController from '../controllers/venta.controller';

const router = Router();

router.get('/', ventaController.listar);
router.get('/historial', ventaController.historial);
router.get('/:id', ventaController.obtenerPorId);
router.post('/', ventaController.crear);

export default router;
