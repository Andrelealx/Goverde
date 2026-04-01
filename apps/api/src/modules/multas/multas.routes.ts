import { Router, Response, NextFunction } from 'express';
import { autenticar, autorizar, AuthRequest } from '../../middlewares/auth.middleware';
import { validarTenant } from '../../middlewares/tenant.middleware';
import * as service from './multas.service';
import { z } from 'zod';

const router = Router();
router.use(autenticar, validarTenant);

const emitirSchema = z.object({
  ocorrenciaId: z.string().optional(),
  autuadoNome: z.string().min(2),
  autuadoCpfCnpj: z.string(),
  autuadoEndereco: z.string(),
  descricao: z.string().min(10),
  artigos: z.string().optional(),
  valorMulta: z.number().positive(),
  dataInfracao: z.string().transform((v) => new Date(v)),
  dataVencimento: z.string().transform((v) => new Date(v)),
});

// GET /api/multas/resumo
router.get('/resumo', autorizar('SECRETARIO', 'ADMIN_SISTEMA', 'FISCAL'), async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const data = await service.resumoMultas(req.usuario!.tenantId);
    res.json(data);
  } catch (err) { next(err); }
});

// GET /api/multas
router.get('/', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { status, fiscalId, busca } = req.query as Record<string, string>;
    const data = await service.listarAutoInfracoes(req.usuario!.tenantId, { status, fiscalId, busca });
    res.json(data);
  } catch (err) { next(err); }
});

// GET /api/multas/:id
router.get('/:id', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const data = await service.buscarAutoInfracao(req.params.id, req.usuario!.tenantId);
    res.json(data);
  } catch (err) { next(err); }
});

// POST /api/multas
router.post('/', autorizar('SECRETARIO', 'ADMIN_SISTEMA', 'FISCAL'), async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const dados = emitirSchema.parse(req.body);
    const multa = await service.emitirAutoInfracao(req.usuario!.tenantId, req.usuario!.sub, dados);
    res.status(201).json(multa);
  } catch (err) { next(err); }
});

// PATCH /api/multas/:id/status
router.patch('/:id/status', autorizar('SECRETARIO', 'ADMIN_SISTEMA'), async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { status, dataPagamento } = z.object({
      status: z.enum(['EMITIDA', 'NOTIFICADA', 'PAGA', 'CANCELADA', 'VENCIDA']),
      dataPagamento: z.string().transform((v) => new Date(v)).optional(),
    }).parse(req.body);
    const data = await service.atualizarStatusMulta(req.params.id, req.usuario!.tenantId, status, dataPagamento);
    res.json(data);
  } catch (err) { next(err); }
});

export default router;
