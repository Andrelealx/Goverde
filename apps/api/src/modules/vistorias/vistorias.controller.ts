import { Response, NextFunction } from 'express';
import { AuthRequest } from '../../middlewares/auth.middleware';
import { criarVistoriaSchema, atualizarVistoriaSchema } from '@goverde/shared';
import * as service from './vistorias.service';

export async function listar(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const result = await service.listar(req.usuario!.tenantId, {
      status: req.query.status as string | undefined,
      fiscalId: req.query.fiscalId as string | undefined,
    });
    res.json(result);
  } catch (err) {
    next(err);
  }
}

export async function criar(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const dados = criarVistoriaSchema.parse(req.body);
    const vistoria = await service.criar(req.usuario!.tenantId, dados);
    res.status(201).json(vistoria);
  } catch (err) {
    next(err);
  }
}

export async function atualizar(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const dados = atualizarVistoriaSchema.parse(req.body);
    const vistoria = await service.atualizar(req.usuario!.tenantId, req.params.id, dados);
    res.json(vistoria);
  } catch (err) {
    next(err);
  }
}
