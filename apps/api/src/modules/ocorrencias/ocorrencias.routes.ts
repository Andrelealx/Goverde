import { Router } from 'express';
import { autenticar, autorizar } from '../../middlewares/auth.middleware';
import { validarTenant } from '../../middlewares/tenant.middleware';
import { uploadFotos } from '../../middlewares/upload.middleware';
import * as ctrl from './ocorrencias.controller';

const router = Router();

router.use(autenticar, validarTenant);

router.get('/', ctrl.listar);
router.post('/', uploadFotos, ctrl.criar);
router.get('/:id', ctrl.buscarPorId);
router.patch('/:id/status', ctrl.atualizarStatus);
router.patch('/:id/visibilidade', autorizar('SECRETARIO', 'ADMIN_SISTEMA', 'FISCAL'), ctrl.alternarVisibilidade);
router.patch('/:id/fiscal', autorizar('SECRETARIO', 'ADMIN_SISTEMA'), ctrl.atribuirFiscal);
router.delete('/:id', autorizar('SECRETARIO', 'ADMIN_SISTEMA'), ctrl.remover);

export default router;
