import { Router } from 'express';
import { autenticar } from '../../middlewares/auth.middleware';
import { validarTenant } from '../../middlewares/tenant.middleware';
import * as ctrl from './vistorias.controller';

const router = Router();
router.use(autenticar, validarTenant);

router.get('/', ctrl.listar);
router.post('/', ctrl.criar);
router.patch('/:id', ctrl.atualizar);

export default router;
