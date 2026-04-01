import { Response, NextFunction } from 'express';
import { AuthRequest } from '../../middlewares/auth.middleware';
import { criarLicencaSchema, atualizarStatusLicencaSchema, atribuirFiscalSchema } from '@goverde/shared';
import * as service from './licencas.service';

export async function listar(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const result = await service.listar(req.usuario!.tenantId, {
      status: req.query.status as string | undefined,
      cursor: req.query.cursor as string | undefined,
      limite: req.query.limite ? parseInt(req.query.limite as string) : 20,
    });
    res.json(result);
  } catch (err) {
    next(err);
  }
}

export async function listarVencendo(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const dias = req.query.dias ? parseInt(req.query.dias as string) : 30;
    const result = await service.listarVencendo(req.usuario!.tenantId, dias);
    res.json(result);
  } catch (err) {
    next(err);
  }
}

export async function buscarPorId(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const licenca = await service.buscarPorId(req.usuario!.tenantId, req.params.id);
    res.json(licenca);
  } catch (err) {
    next(err);
  }
}

export async function criar(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const dados = criarLicencaSchema.parse(req.body);
    const licenca = await service.criar(req.usuario!.tenantId, dados);
    res.status(201).json(licenca);
  } catch (err) {
    next(err);
  }
}

export async function atualizarStatus(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const dados = atualizarStatusLicencaSchema.parse(req.body);
    const licenca = await service.atualizarStatus(req.usuario!.tenantId, req.params.id, dados);
    res.json(licenca);
  } catch (err) {
    next(err);
  }
}

export async function atribuirFiscal(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const dados = atribuirFiscalSchema.parse(req.body);
    const licenca = await service.atribuirFiscal(req.usuario!.tenantId, req.params.id, dados);
    res.json(licenca);
  } catch (err) {
    next(err);
  }
}
