import { Router } from 'express';
import * as configuracionController from '../controllers/configuracion.controller';

const router = Router();

router.get('/ganancias', configuracionController.obtenerGanancias);
router.put('/ganancias', configuracionController.actualizarGanancia);

router.get('/impuestos', configuracionController.listarImpuestos);
router.post('/impuestos', configuracionController.crearImpuesto);
router.put('/impuestos/:id', configuracionController.editarImpuesto);
router.delete('/impuestos/:id', configuracionController.eliminarImpuesto);

export default router;
