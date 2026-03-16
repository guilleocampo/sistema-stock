import { Router } from 'express';
import * as productoController from '../controllers/producto.controller';

const router = Router();

// IMPORTANTE: /bajo-stock debe ir antes de /:id para que Express no lo interprete
// como un ID con valor "bajo-stock"
router.get('/bajo-stock', productoController.bajoStock);

router.get('/', productoController.listar);
router.get('/:id', productoController.obtenerPorId);
router.post('/', productoController.crear);
router.put('/:id', productoController.editar);
router.delete('/:id', productoController.darDeBaja);

export default router;
