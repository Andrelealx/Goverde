import { Router, Response, NextFunction } from 'express';
import { autenticar, autorizar, AuthRequest } from '../../middlewares/auth.middleware';
import { validarTenant } from '../../middlewares/tenant.middleware';
import * as service from './atestados.service';
import { z } from 'zod';

const router = Router();
router.use(autenticar, validarTenant);

const criarSchema = z.object({
  dataInicio: z.string().transform((v) => new Date(v)),
  dataFim: z.string().transform((v) => new Date(v)),
  cid: z.string().optional(),
  medicoNome: z.string().optional(),
  arquivoUrl: z.string().optional(),
  observacao: z.string().optional(),
});

// GET /api/atestados/meus
router.get('/meus', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const data = await service.meuAtestados(req.usuario!.sub, req.usuario!.tenantId);
    res.json(data);
  } catch (err) { next(err); }
});

// POST /api/atestados — enviar atestado
router.post('/', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const dados = criarSchema.parse(req.body);
    const atestado = await service.criarAtestado(req.usuario!.sub, req.usuario!.tenantId, dados);
    res.status(201).json(atestado);
  } catch (err) { next(err); }
});

// GET /api/atestados — listar todos (secretário)
router.get('/', autorizar('SECRETARIO', 'ADMIN_SISTEMA'), async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { usuarioId, status } = req.query as Record<string, string>;
    const data = await service.listarAtestados(req.usuario!.tenantId, usuarioId, status);
    res.json(data);
  } catch (err) { next(err); }
});

// PATCH /api/atestados/:id/status
router.patch('/:id/status', autorizar('SECRETARIO', 'ADMIN_SISTEMA'), async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { status, observacao } = z.object({
      status: z.enum(['APROVADO', 'REJEITADO']),
      observacao: z.string().optional(),
    }).parse(req.body);
    const data = await service.atualizarStatusAtestado(req.params.id, req.usuario!.tenantId, status, observacao);
    res.json(data);
  } catch (err) { next(err); }
});

// DELETE /api/atestados/:id
router.delete('/:id', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    await service.deletarAtestado(req.params.id, req.usuario!.sub, req.usuario!.tenantId);
    res.status(204).send();
  } catch (err) { next(err); }
});

export default router;
