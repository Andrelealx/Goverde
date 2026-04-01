import prisma from '../../prisma/client';
import { AppError } from '../../middlewares/error.middleware';

export async function salvarPerfilFacial(
  usuarioId: string,
  descritores: number[][],
  fotoUrl: string
) {
  return prisma.perfilFacial.upsert({
    where: { usuarioId },
    update: { descritores, fotoUrl },
    create: { usuarioId, descritores, fotoUrl },
  });
}

export async function buscarPerfilFacial(usuarioId: string) {
  return prisma.perfilFacial.findUnique({ where: { usuarioId } });
}

export async function registrarPonto(
  usuarioId: string,
  tenantId: string,
  dados: {
    tipo: 'ENTRADA' | 'SAIDA' | 'ALMOCO_SAIDA' | 'ALMOCO_VOLTA';
    latitude: number;
    longitude: number;
    precisao?: number;
    enderecoAprox?: string;
    verificacaoFacial: boolean;
    similaridade?: number;
    fotoCaptura?: string;
  }
) {
  return prisma.registroPonto.create({
    data: {
      usuarioId,
      tenantId,
      tipo: dados.tipo,
      latitude: dados.latitude,
      longitude: dados.longitude,
      precisao: dados.precisao,
      enderecoAprox: dados.enderecoAprox,
      verificacaoFacial: dados.verificacaoFacial,
      similaridade: dados.similaridade,
      fotoCaptura: dados.fotoCaptura,
    },
    include: {
      usuario: { select: { nome: true, email: true } },
    },
  });
}

export async function listarPontosHoje(tenantId: string, usuarioId?: string) {
  const inicio = new Date();
  inicio.setHours(0, 0, 0, 0);
  const fim = new Date();
  fim.setHours(23, 59, 59, 999);

  return prisma.registroPonto.findMany({
    where: {
      tenantId,
      ...(usuarioId && { usuarioId }),
      criadoEm: { gte: inicio, lte: fim },
    },
    include: { usuario: { select: { id: true, nome: true, papel: true } } },
    orderBy: { criadoEm: 'asc' },
  });
}

export async function listarPontosPorPeriodo(
  tenantId: string,
  dataInicio: Date,
  dataFim: Date,
  usuarioId?: string
) {
  return prisma.registroPonto.findMany({
    where: {
      tenantId,
      ...(usuarioId && { usuarioId }),
      criadoEm: { gte: dataInicio, lte: dataFim },
    },
    include: { usuario: { select: { id: true, nome: true, papel: true } } },
    orderBy: { criadoEm: 'asc' },
  });
}

export async function resumoPontosUsuario(tenantId: string, usuarioId: string) {
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  const amanha = new Date(hoje);
  amanha.setDate(amanha.getDate() + 1);

  const pontosHoje = await prisma.registroPonto.findMany({
    where: { tenantId, usuarioId, criadoEm: { gte: hoje, lt: amanha } },
    orderBy: { criadoEm: 'asc' },
  });

  const ultimoPonto = pontosHoje[pontosHoje.length - 1];

  const proximoTipo = determinarProximoTipo(pontosHoje.map((p) => p.tipo as string));

  return { pontosHoje, ultimoPonto, proximoTipo };
}

function determinarProximoTipo(tipos: string[]): string {
  if (tipos.length === 0) return 'ENTRADA';
  const ultimo = tipos[tipos.length - 1];
  const mapa: Record<string, string> = {
    ENTRADA: 'ALMOCO_SAIDA',
    ALMOCO_SAIDA: 'ALMOCO_VOLTA',
    ALMOCO_VOLTA: 'SAIDA',
    SAIDA: 'ENCERRADO',
  };
  return mapa[ultimo] ?? 'ENTRADA';
}
