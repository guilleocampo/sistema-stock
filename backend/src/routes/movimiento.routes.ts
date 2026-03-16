import { Router } from 'express';
import * as movimientoController from '../controllers/movimiento.controller';

const router = Router();

// IMPORTANTE: /producto/:id debe ir antes de /:id para evitar colisión de rutas
router.get('/producto/:id', movimientoController.listarPorProducto);

router.get('/', movimientoController.listar);
router.post('/', movimientoController.registrar);

export default router;
