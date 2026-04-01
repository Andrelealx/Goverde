import prisma from '../../prisma/client';
import { AppError } from '../../middlewares/error.middleware';
import { CriarVistoriaInput, AtualizarVistoriaInput } from '@goverde/shared';

const includeBasico = {
  fiscal: { select: { id: true, nome: true } },
  licenca: { select: { id: true, protocolo: true, requerente: true } },
};

export async function listar(tenantId: string, filtros: { status?: string; fiscalId?: string }) {
  return prisma.vistoria.findMany({
    where: {
      tenantId,
      ...(filtros.status && { status: filtros.status as any }),
      ...(filtros.fiscalId && { fiscalId: filtros.fiscalId }),
    },
    include: includeBasico,
    orderBy: { dataAgendada: 'asc' },
  });
}

export async function criar(tenantId: string, dados: CriarVistoriaInput) {
  const fiscal = await prisma.usuario.findFirst({
    where: { id: dados.fiscalId, tenantId, ativo: true },
  });
  if (!fiscal) throw new AppError('Fiscal não encontrado', 404);

  return prisma.vistoria.create({
    data: {
      tenantId,
      fiscalId: dados.fiscalId,
      licencaId: dados.licencaId,
      ocorrenciaId: dados.ocorrenciaId,
      dataAgendada: new Date(dados.dataAgendada),
      observacoes: dados.observacoes,
    },
    include: includeBasico,
  });
}

export async function atualizar(tenantId: string, id: string, dados: AtualizarVistoriaInput) {
  const vistoria = await prisma.vistoria.findFirst({ where: { id, tenantId } });
  if (!vistoria) throw new AppError('Vistoria não encontrada', 404);

  return prisma.vistoria.update({
    where: { id },
    data: {
      status: dados.status,
      ...(dados.dataRealizada && { dataRealizada: new Date(dados.dataRealizada) }),
      ...(dados.observacoes !== undefined && { observacoes: dados.observacoes }),
    },
    include: includeBasico,
  });
}
