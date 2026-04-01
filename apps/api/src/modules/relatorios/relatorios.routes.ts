import { Router } from 'express';
import { Response, NextFunction } from 'express';
import { autenticar } from '../../middlewares/auth.middleware';
import { validarTenant } from '../../middlewares/tenant.middleware';
import { AuthRequest } from '../../middlewares/auth.middleware';
import prisma from '../../prisma/client';

const router = Router();
router.use(autenticar, validarTenant);

router.get('/ocorrencias', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { dataInicio, dataFim, status } = req.query;

    const data = await prisma.ocorrencia.findMany({
      where: {
        tenantId: req.usuario!.tenantId,
        ...(status && { status: status as any }),
        ...(dataInicio && dataFim && {
          criadoEm: {
            gte: new Date(dataInicio as string),
            lte: new Date(dataFim as string),
          },
        }),
      },
      include: {
        fiscalResponsavel: { select: { nome: true } },
        fotos: { select: { url: true } },
      },
      orderBy: { criadoEm: 'desc' },
    });

    res.json({ data, total: data.length });
  } catch (err) {
    next(err);
  }
});

router.get('/licencas', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { dataInicio, dataFim, status } = req.query;

    const data = await prisma.licencaAmbiental.findMany({
      where: {
        tenantId: req.usuario!.tenantId,
        ...(status && { status: status as any }),
        ...(dataInicio && dataFim && {
          criadoEm: {
            gte: new Date(dataInicio as string),
            lte: new Date(dataFim as string),
          },
        }),
      },
      include: { fiscalResponsavel: { select: { nome: true } } },
      orderBy: { criadoEm: 'desc' },
    });

    res.json({ data, total: data.length });
  } catch (err) {
    next(err);
  }
});

export default router;
