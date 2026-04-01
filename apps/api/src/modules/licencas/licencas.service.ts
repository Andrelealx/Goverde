import prisma from '../../prisma/client';
import { AppError } from '../../middlewares/error.middleware';
import { CriarLicencaInput, AtualizarStatusLicencaInput, AtribuirFiscalInput } from '@goverde/shared';

async function gerarProtocolo(tenantId: string): Promise<string> {
  const ano = new Date().getFullYear();

  return prisma.$transaction(async (tx) => {
    const seq = await tx.protocoloSequencia.upsert({
      where: { tenantId_tipo_ano: { tenantId, tipo: 'LIC', ano } },
      update: { ultimo: { increment: 1 } },
      create: { tenantId, tipo: 'LIC', ano, ultimo: 1 },
    });

    return `LIC-${ano}-${String(seq.ultimo).padStart(5, '0')}`;
  });
}

const includeBasico = {
  fiscalResponsavel: { select: { id: true, nome: true } },
};

export async function listar(
  tenantId: string,
  filtros: { status?: string; cursor?: string; limite?: number }
) {
  const where = {
    tenantId,
    ...(filtros.status && { status: filtros.status as any }),
  };

  const limite = filtros.limite ?? 20;

  const [total, data] = await prisma.$transaction([
    prisma.licencaAmbiental.count({ where }),
    prisma.licencaAmbiental.findMany({
      where,
      include: includeBasico,
      orderBy: { criadoEm: 'desc' },
      take: limite + 1,
      ...(filtros.cursor && { cursor: { id: filtros.cursor }, skip: 1 }),
    }),
  ]);

  const hasMore = data.length > limite;
  const items = hasMore ? data.slice(0, limite) : data;
  const nextCursor = hasMore ? items[items.length - 1].id : null;

  return { data: items, nextCursor, total };
}

export async function listarVencendo(tenantId: string, dias: number = 30) {
  const dataLimite = new Date(Date.now() + dias * 24 * 60 * 60 * 1000);

  return prisma.licencaAmbiental.findMany({
    where: {
      tenantId,
      status: 'APROVADA',
      dataValidade: { lte: dataLimite, gte: new Date() },
    },
    include: includeBasico,
    orderBy: { dataValidade: 'asc' },
  });
}

export async function buscarPorId(tenantId: string, id: string) {
  const licenca = await prisma.licencaAmbiental.findFirst({
    where: { id, tenantId },
    include: { ...includeBasico, vistorias: { include: { fiscal: { select: { id: true, nome: true } } } } },
  });

  if (!licenca) throw new AppError('Licença não encontrada', 404);
  return licenca;
}

export async function criar(tenantId: string, dados: CriarLicencaInput) {
  const protocolo = await gerarProtocolo(tenantId);

  return prisma.licencaAmbiental.create({
    data: {
      tenantId,
      protocolo,
      tipo: dados.tipo,
      requerente: dados.requerente,
      cpfCnpj: dados.cpfCnpj,
      atividade: dados.atividade,
      endereco: dados.endereco,
      dataValidade: dados.dataValidade ? new Date(dados.dataValidade) : undefined,
    },
    include: includeBasico,
  });
}

export async function atualizarStatus(
  tenantId: string,
  id: string,
  dados: AtualizarStatusLicencaInput
) {
  const licenca = await prisma.licencaAmbiental.findFirst({ where: { id, tenantId } });
  if (!licenca) throw new AppError('Licença não encontrada', 404);

  return prisma.licencaAmbiental.update({
    where: { id },
    data: {
      status: dados.status,
      ...(dados.dataValidade && { dataValidade: new Date(dados.dataValidade) }),
    },
    include: includeBasico,
  });
}

export async function atribuirFiscal(tenantId: string, id: string, dados: AtribuirFiscalInput) {
  const licenca = await prisma.licencaAmbiental.findFirst({ where: { id, tenantId } });
  if (!licenca) throw new AppError('Licença não encontrada', 404);

  const fiscal = await prisma.usuario.findFirst({
    where: { id: dados.fiscalId, tenantId, ativo: true },
  });
  if (!fiscal) throw new AppError('Fiscal não encontrado', 404);

  return prisma.licencaAmbiental.update({
    where: { id },
    data: { fiscalResponsavelId: dados.fiscalId },
    include: includeBasico,
  });
}
