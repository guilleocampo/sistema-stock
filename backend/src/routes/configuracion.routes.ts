import { Router } from 'express';
import * as configuracionController from '../controllers/configuracion.controller';

const router = Router();

router.get('/ganancias', configuracionController.obtenerGanancias);
router.put('/ganancias', configuracionController.actualizarGanancia);

export default router;
