import prisma from '../../prisma/client';
import { AppError } from '../../middlewares/error.middleware';
import {
  CriarOcorrenciaInput,
  AtualizarStatusOcorrenciaInput,
  AtribuirFiscalInput,
  FiltrosOcorrenciaInput,
} from '@goverde/shared';

async function gerarProtocolo(tenantId: string): Promise<string> {
  const ano = new Date().getFullYear();

  return prisma.$transaction(async (tx) => {
    const seq = await tx.protocoloSequencia.upsert({
      where: { tenantId_tipo_ano: { tenantId, tipo: 'OC', ano } },
      update: { ultimo: { increment: 1 } },
      create: { tenantId, tipo: 'OC', ano, ultimo: 1 },
    });

    return `OC-${ano}-${String(seq.ultimo).padStart(5, '0')}`;
  });
}

const includeCompleto = {
  fiscalResponsavel: { select: { id: true, nome: true } },
  fotos: true,
  historicos: {
    include: { usuario: { select: { id: true, nome: true } } },
    orderBy: { criadoEm: 'asc' as const },
  },
};

export async function listar(tenantId: string, filtros: FiltrosOcorrenciaInput) {
  const { status, categoria, prioridade, bairro, fiscalId, cursor, limite } = filtros;

  const where = {
    tenantId,
    ...(status && { status }),
    ...(categoria && { categoria }),
    ...(prioridade && { prioridade }),
    ...(bairro && { bairro: { contains: bairro, mode: 'insensitive' as const } }),
    ...(fiscalId && { fiscalResponsavelId: fiscalId }),
  };

  const [total, data] = await prisma.$transaction([
    prisma.ocorrencia.count({ where }),
    prisma.ocorrencia.findMany({
      where,
      include: { fiscalResponsavel: { select: { id: true, nome: true } }, fotos: true },
      orderBy: { criadoEm: 'desc' },
      take: limite + 1,
      ...(cursor && { cursor: { id: cursor }, skip: 1 }),
    }),
  ]);

  const hasMore = data.length > limite;
  const items = hasMore ? data.slice(0, limite) : data;
  const nextCursor = hasMore ? items[items.length - 1].id : null;

  return { data: items, nextCursor, total };
}

export async function buscarPorId(tenantId: string, id: string) {
  const ocorrencia = await prisma.ocorrencia.findFirst({
    where: { id, tenantId },
    include: includeCompleto,
  });

  if (!ocorrencia) throw new AppError('Ocorrência não encontrada', 404);
  return ocorrencia;
}

export async function criar(
  tenantId: string,
  usuarioId: string,
  dados: CriarOcorrenciaInput,
  arquivos: Express.Multer.File[]
) {
  const protocolo = await gerarProtocolo(tenantId);

  const ocorrencia = await prisma.$transaction(async (tx) => {
    const oc = await tx.ocorrencia.create({
      data: {
        tenantId,
        protocolo,
        titulo: dados.titulo,
        descricao: dados.descricao,
        categoria: dados.categoria,
        prioridade: dados.prioridade ?? 'MEDIA',
        latitude: dados.latitude,
        longitude: dados.longitude,
        endereco: dados.endereco,
        bairro: dados.bairro,
        nomeDenunciante: dados.nomeDenunciante,
        contatoDenunciante: dados.contatoDenunciante,
        fotos: {
          create: arquivos.map((f) => ({
            url: `/uploads/${f.filename}`,
            nomeArquivo: f.originalname,
          })),
        },
        historicos: {
          create: {
            statusNovo: 'ABERTA',
            usuarioId,
            comentario: 'Ocorrência registrada',
            visivelCidadao: true,
          },
        },
      },
      include: includeCompleto,
    });
    return oc;
  });

  return ocorrencia;
}

export async function atualizarStatus(
  tenantId: string,
  id: string,
  usuarioId: string,
  dados: AtualizarStatusOcorrenciaInput
) {
  const ocorrencia = await prisma.ocorrencia.findFirst({ where: { id, tenantId } });
  if (!ocorrencia) throw new AppError('Ocorrência não encontrada', 404);

  return prisma.$transaction(async (tx) => {
    const atualizada = await tx.ocorrencia.update({
      where: { id },
      data: { status: dados.status },
    });

    await tx.ocorrenciaHistorico.create({
      data: {
        ocorrenciaId: id,
        usuarioId,
        statusAnterior: ocorrencia.status,
        statusNovo: dados.status,
        comentario: dados.comentario,
        visivelCidadao: dados.visivelCidadao ?? false,
      },
    });

    return atualizada;
  });
}

export async function atribuirFiscal(
  tenantId: string,
  id: string,
  dados: AtribuirFiscalInput
) {
  const ocorrencia = await prisma.ocorrencia.findFirst({ where: { id, tenantId } });
  if (!ocorrencia) throw new AppError('Ocorrência não encontrada', 404);

  const fiscal = await prisma.usuario.findFirst({
    where: { id: dados.fiscalId, tenantId, ativo: true },
  });
  if (!fiscal) throw new AppError('Fiscal não encontrado', 404);

  return prisma.ocorrencia.update({
    where: { id },
    data: { fiscalResponsavelId: dados.fiscalId },
    include: includeCompleto,
  });
}

export async function alternarVisibilidade(tenantId: string, id: string) {
  const ocorrencia = await prisma.ocorrencia.findFirst({
    where: { id, tenantId },
    select: { id: true, visivelPortal: true },
  });
  if (!ocorrencia) throw new AppError('Ocorrência não encontrada', 404);

  return prisma.ocorrencia.update({
    where: { id },
    data: { visivelPortal: !ocorrencia.visivelPortal },
    select: { id: true, visivelPortal: true },
  });
}

export async function remover(tenantId: string, id: string) {
  const ocorrencia = await prisma.ocorrencia.findFirst({ where: { id, tenantId } });
  if (!ocorrencia) throw new AppError('Ocorrência não encontrada', 404);

  // Soft delete via arquivamento
  return prisma.ocorrencia.update({
    where: { id },
    data: { status: 'ARQUIVADA' },
  });
}
