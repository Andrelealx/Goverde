import { Router } from 'express';
import { autenticar, autorizar } from '../../middlewares/auth.middleware';
import { validarTenant } from '../../middlewares/tenant.middleware';
import * as ctrl from './licencas.controller';

const router = Router();
router.use(autenticar, validarTenant);

router.get('/vencendo', ctrl.listarVencendo);
router.get('/', ctrl.listar);
router.post('/', autorizar('SECRETARIO', 'ADMIN_SISTEMA', 'OPERADOR'), ctrl.criar);
router.get('/:id', ctrl.buscarPorId);
router.patch('/:id/status', ctrl.atualizarStatus);
router.patch('/:id/fiscal', autorizar('SECRETARIO', 'ADMIN_SISTEMA'), ctrl.atribuirFiscal);

export default router;
