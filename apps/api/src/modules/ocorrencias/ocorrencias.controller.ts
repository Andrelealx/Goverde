import { Response, NextFunction } from 'express';
import { AuthRequest } from '../../middlewares/auth.middleware';
import {
  criarOcorrenciaSchema,
  atualizarStatusOcorrenciaSchema,
  atribuirFiscalSchema,
  filtrosOcorrenciaSchema,
} from '@goverde/shared';
import * as service from './ocorrencias.service';
import * as auditoria from '../auditoria/auditoria.service';

export async function listar(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const filtros = filtrosOcorrenciaSchema.parse(req.query);
    const result = await service.listar(req.usuario!.tenantId, filtros);
    res.json(result);
  } catch (err) {
    next(err);
  }
}

export async function buscarPorId(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const ocorrencia = await service.buscarPorId(req.usuario!.tenantId, req.params.id);
    res.json(ocorrencia);
  } catch (err) {
    next(err);
  }
}

export async function criar(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const dados = criarOcorrenciaSchema.parse(
      typeof req.body.dados === 'string' ? JSON.parse(req.body.dados) : req.body
    );
    const arquivos = (req.files as Express.Multer.File[]) ?? [];
    const ocorrencia = await service.criar(req.usuario!.tenantId, req.usuario!.sub, dados, arquivos);
    res.status(201).json(ocorrencia);
  } catch (err) {
    next(err);
  }
}

export async function atualizarStatus(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const dados = atualizarStatusOcorrenciaSchema.parse(req.body);
    const ocorrencia = await service.atualizarStatus(
      req.usuario!.tenantId,
      req.params.id,
      req.usuario!.sub,
      dados
    );
    auditoria.registrar({
      tenantId: req.usuario!.tenantId,
      usuarioId: req.usuario!.sub,
      acao: 'STATUS_ATUALIZADO',
      entidade: 'Ocorrencia',
      entidadeId: req.params.id,
      detalhes: { novoStatus: dados.status },
      ip: req.ip,
    });
    res.json(ocorrencia);
  } catch (err) {
    next(err);
  }
}

export async function atribuirFiscal(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const dados = atribuirFiscalSchema.parse(req.body);
    const ocorrencia = await service.atribuirFiscal(req.usuario!.tenantId, req.params.id, dados);
    res.json(ocorrencia);
  } catch (err) {
    next(err);
  }
}

export async function alternarVisibilidade(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const resultado = await service.alternarVisibilidade(req.usuario!.tenantId, req.params.id);
    res.json(resultado);
  } catch (err) {
    next(err);
  }
}

export async function remover(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    await service.remover(req.usuario!.tenantId, req.params.id);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}
