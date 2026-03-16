import { Router } from 'express';
import * as proveedorController from '../controllers/proveedor.controller';

const router = Router();

router.get('/', proveedorController.listar);
router.get('/:id', proveedorController.obtenerPorId);
router.post('/', proveedorController.crear);
router.put('/:id', proveedorController.editar);
router.delete('/:id', proveedorController.darDeBaja);

export default router;
