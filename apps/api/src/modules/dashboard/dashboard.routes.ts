import { Router } from 'express';
import { Response, NextFunction } from 'express';
import { autenticar } from '../../middlewares/auth.middleware';
import { validarTenant } from '../../middlewares/tenant.middleware';
import { AuthRequest } from '../../middlewares/auth.middleware';
import * as service from './dashboard.service';

const router = Router();
router.use(autenticar, validarTenant);

router.get('/resumo', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const data = await service.resumo(req.usuario!.tenantId);
    res.json(data);
  } catch (err) {
    next(err);
  }
});

router.get('/ocorrencias-por-mes', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const data = await service.ocorrenciasPorMes(req.usuario!.tenantId);
    res.json(data);
  } catch (err) {
    next(err);
  }
});

router.get('/ocorrencias-por-bairro', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const data = await service.ocorrenciasPorBairro(req.usuario!.tenantId);
    res.json(data);
  } catch (err) {
    next(err);
  }
});

router.get('/ocorrencias-por-categoria', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const data = await service.ocorrenciasPorCategoria(req.usuario!.tenantId);
    res.json(data);
  } catch (err) {
    next(err);
  }
});

export default router;
