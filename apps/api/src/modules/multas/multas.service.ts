import prisma from '../../prisma/client';
import { AppError } from '../../middlewares/error.middleware';

async function gerarNumeroMulta(tenantId: string): Promise<string> {
  const ano = new Date().getFullYear();
  const seq = await prisma.$transaction(async (tx) => {
    const registro = await tx.protocoloSequencia.upsert({
      where: { tenantId_tipo_ano: { tenantId, tipo: 'MULTA', ano } },
      update: { ultimo: { increment: 1 } },
      create: { tenantId, tipo: 'MULTA', ano, ultimo: 1 },
    });
    return registro.ultimo;
  });
  return `AI-${ano}-${String(seq).padStart(5, '0')}`;
}

export async function emitirAutoInfracao(
  tenantId: string,
  fiscalId: string,
  dados: {
    ocorrenciaId?: string;
    autuadoNome: string;
    autuadoCpfCnpj: string;
    autuadoEndereco: string;
    descricao: string;
    artigos?: string;
    valorMulta: number;
    dataInfracao: Date;
    dataVencimento: Date;
  }
) {
  const numero = await gerarNumeroMulta(tenantId);
  return prisma.autoInfracao.create({
    data: {
      tenantId,
      fiscalId,
      numero,
      ...dados,
    },
    include: {
      fiscal: { select: { nome: true } },
    },
  });
}

export async function listarAutoInfracoes(
  tenantId: string,
  filtros: { status?: string; fiscalId?: string; busca?: string }
) {
  return prisma.autoInfracao.findMany({
    where: {
      tenantId,
      ...(filtros.status && { status: filtros.status as any }),
      ...(filtros.fiscalId && { fiscalId: filtros.fiscalId }),
      ...(filtros.busca && {
        OR: [
          { numero: { contains: filtros.busca, mode: 'insensitive' } },
          { autuadoNome: { contains: filtros.busca, mode: 'insensitive' } },
          { autuadoCpfCnpj: { contains: filtros.busca } },
        ],
      }),
    },
    include: {
      fiscal: { select: { id: true, nome: true } },
    },
    orderBy: { criadoEm: 'desc' },
  });
}

export async function buscarAutoInfracao(id: string, tenantId: string) {
  const multa = await prisma.autoInfracao.findFirst({
    where: { id, tenantId },
    include: { fiscal: { select: { id: true, nome: true } } },
  });
  if (!multa) throw new AppError('Auto de infração não encontrado', 404);
  return multa;
}

export async function atualizarStatusMulta(
  id: string,
  tenantId: string,
  status: string,
  dataPagamento?: Date
) {
  const multa = await prisma.autoInfracao.findFirst({ where: { id, tenantId } });
  if (!multa) throw new AppError('Auto de infração não encontrado', 404);

  return prisma.autoInfracao.update({
    where: { id },
    data: {
      status: status as any,
      ...(dataPagamento && { dataPagamento }),
    },
  });
}

export async function resumoMultas(tenantId: string) {
  const [total, emitidas, pagas, vencidas, valorTotal, valorRecebido] = await Promise.all([
    prisma.autoInfracao.count({ where: { tenantId } }),
    prisma.autoInfracao.count({ where: { tenantId, status: 'EMITIDA' } }),
    prisma.autoInfracao.count({ where: { tenantId, status: 'PAGA' } }),
    prisma.autoInfracao.count({ where: { tenantId, status: 'VENCIDA' } }),
    prisma.autoInfracao.aggregate({ where: { tenantId }, _sum: { valorMulta: true } }),
    prisma.autoInfracao.aggregate({ where: { tenantId, status: 'PAGA' }, _sum: { valorMulta: true } }),
  ]);
  return {
    total,
    emitidas,
    pagas,
    vencidas,
    valorTotal: valorTotal._sum.valorMulta ?? 0,
    valorRecebido: valorRecebido._sum.valorMulta ?? 0,
  };
}
