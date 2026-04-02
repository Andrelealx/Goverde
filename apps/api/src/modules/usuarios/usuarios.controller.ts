import { Response, NextFunction } from 'express';
import { AuthRequest } from '../../middlewares/auth.middleware';
import { criarUsuarioSchema, atualizarUsuarioSchema } from '@goverde/shared';
import * as service from './usuarios.service';
import { z } from 'zod';
import * as auditoria from '../auditoria/auditoria.service';

export async function listar(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const usuarios = await service.listar(req.usuario!.tenantId);
    res.json(usuarios);
  } catch (err) {
    next(err);
  }
}

export async function criar(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const dados = criarUsuarioSchema.parse(req.body);
    const usuario = await service.criar(req.usuario!.tenantId, dados);
    auditoria.registrar({
      tenantId: req.usuario!.tenantId,
      usuarioId: req.usuario!.sub,
      acao: 'USUARIO_CRIADO',
      entidade: 'Usuario',
      entidadeId: usuario.id,
      detalhes: { nome: usuario.nome, papel: usuario.papel },
      ip: req.ip,
    });
    res.status(201).json(usuario);
  } catch (err) {
    next(err);
  }
}

export async function atualizar(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const dados = atualizarUsuarioSchema.parse(req.body);
    const usuario = await service.atualizar(req.usuario!.tenantId, req.params.id, dados);
    res.json(usuario);
  } catch (err) {
    next(err);
  }
}

export async function alterarAtivo(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { ativo } = z.object({ ativo: z.boolean() }).parse(req.body);
    const usuario = await service.alterarAtivo(req.usuario!.tenantId, req.params.id, ativo);
    res.json(usuario);
  } catch (err) {
    next(err);
  }
}
