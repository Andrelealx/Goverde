import { Router } from 'express';
import { autenticar, autorizar } from '../../middlewares/auth.middleware';
import { validarTenant } from '../../middlewares/tenant.middleware';
import * as ctrl from './usuarios.controller';

const router = Router();
router.use(autenticar, validarTenant, autorizar('SECRETARIO', 'ADMIN_SISTEMA'));

router.get('/', ctrl.listar);
router.post('/', ctrl.criar);
router.patch('/:id', ctrl.atualizar);
router.patch('/:id/ativo', ctrl.alterarAtivo);

export default router;
