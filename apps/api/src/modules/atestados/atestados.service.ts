import prisma from '../../prisma/client';
import { AppError } from '../../middlewares/error.middleware';

export async function criarAtestado(
  usuarioId: string,
  tenantId: string,
  dados: {
    dataInicio: Date;
    dataFim: Date;
    cid?: string;
    medicoNome?: string;
    arquivoUrl?: string;
    observacao?: string;
  }
) {
  const dataInicio = new Date(dados.dataInicio);
  const dataFim = new Date(dados.dataFim);
  dataInicio.setHours(0, 0, 0, 0);
  dataFim.setHours(0, 0, 0, 0);

  const diasAfastamento = Math.round(
    (dataFim.getTime() - dataInicio.getTime()) / (1000 * 60 * 60 * 24)
  ) + 1;

  return prisma.atestado.create({
    data: {
      usuarioId,
      tenantId,
      dataInicio,
      dataFim,
      diasAfastamento,
      cid: dados.cid,
      medicoNome: dados.medicoNome,
      arquivoUrl: dados.arquivoUrl,
      observacao: dados.observacao,
    },
  });
}

export async function listarAtestados(
  tenantId: string,
  usuarioId?: string,
  status?: string
) {
  return prisma.atestado.findMany({
    where: {
      tenantId,
      ...(usuarioId && { usuarioId }),
      ...(status && { status: status as any }),
    },
    include: {
      usuario: { select: { id: true, nome: true, email: true } },
    },
    orderBy: { criadoEm: 'desc' },
  });
}

export async function meuAtestados(usuarioId: string, tenantId: string) {
  return prisma.atestado.findMany({
    where: { usuarioId, tenantId },
    orderBy: { criadoEm: 'desc' },
  });
}

export async function atualizarStatusAtestado(
  id: string,
  tenantId: string,
  status: 'APROVADO' | 'REJEITADO',
  observacao?: string
) {
  const atestado = await prisma.atestado.findFirst({ where: { id, tenantId } });
  if (!atestado) throw new AppError('Atestado não encontrado', 404);

  return prisma.atestado.update({
    where: { id },
    data: { status, observacao },
  });
}

export async function deletarAtestado(id: string, usuarioId: string, tenantId: string) {
  const atestado = await prisma.atestado.findFirst({
    where: { id, tenantId, usuarioId },
  });
  if (!atestado) throw new AppError('Atestado não encontrado', 404);
  if (atestado.status !== 'PENDENTE') throw new AppError('Só é possível excluir atestados pendentes', 400);

  return prisma.atestado.delete({ where: { id } });
}
