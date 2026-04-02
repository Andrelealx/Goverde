import { Router, Response, NextFunction } from 'express';
import { autenticar, autorizar, AuthRequest } from '../../middlewares/auth.middleware';
import { validarTenant } from '../../middlewares/tenant.middleware';
import * as service from './auditoria.service';

const router = Router();
router.use(autenticar, validarTenant, autorizar('SECRETARIO', 'ADMIN_SISTEMA'));

router.get('/', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const logs = await service.listar(req.usuario!.tenantId, {
      entidade: req.query.entidade as string | undefined,
      usuarioId: req.query.usuarioId as string | undefined,
      dataInicio: req.query.dataInicio as string | undefined,
      dataFim: req.query.dataFim as string | undefined,
      limite: req.query.limite ? Number(req.query.limite) : undefined,
    });
    res.json(logs);
  } catch (err) {
    next(err);
  }
});

export default router;
