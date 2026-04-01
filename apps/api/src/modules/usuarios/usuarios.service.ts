import bcrypt from 'bcryptjs';
import prisma from '../../prisma/client';
import { AppError } from '../../middlewares/error.middleware';
import { CriarUsuarioInput, AtualizarUsuarioInput } from '@goverde/shared';

const selectPublico = {
  id: true,
  nome: true,
  email: true,
  papel: true,
  ativo: true,
  criadoEm: true,
  tenantId: true,
};

export async function listar(tenantId: string) {
  return prisma.usuario.findMany({
    where: { tenantId },
    select: selectPublico,
    orderBy: { nome: 'asc' },
  });
}

export async function criar(tenantId: string, dados: CriarUsuarioInput) {
  const existente = await prisma.usuario.findUnique({
    where: { tenantId_email: { tenantId, email: dados.email } },
  });
  if (existente) throw new AppError('E-mail já cadastrado neste tenant', 409);

  const senhaHash = await bcrypt.hash(dados.senha, 10);

  return prisma.usuario.create({
    data: {
      tenantId,
      nome: dados.nome,
      email: dados.email,
      senhaHash,
      papel: dados.papel ?? 'FISCAL',
    },
    select: selectPublico,
  });
}

export async function atualizar(tenantId: string, id: string, dados: AtualizarUsuarioInput) {
  const usuario = await prisma.usuario.findFirst({ where: { id, tenantId } });
  if (!usuario) throw new AppError('Usuário não encontrado', 404);

  const senhaHash = dados.senha ? await bcrypt.hash(dados.senha, 10) : undefined;

  return prisma.usuario.update({
    where: { id },
    data: {
      ...(dados.nome && { nome: dados.nome }),
      ...(dados.papel && { papel: dados.papel }),
      ...(senhaHash && { senhaHash }),
    },
    select: selectPublico,
  });
}

export async function alterarAtivo(tenantId: string, id: string, ativo: boolean) {
  const usuario = await prisma.usuario.findFirst({ where: { id, tenantId } });
  if (!usuario) throw new AppError('Usuário não encontrado', 404);

  return prisma.usuario.update({
    where: { id },
    data: { ativo },
    select: selectPublico,
  });
}
