import prisma from '../../prisma/client';

export interface RegistrarAuditoriaParams {
  tenantId: string;
  usuarioId?: string;
  acao: string;
  entidade: string;
  entidadeId?: string;
  detalhes?: object;
  ip?: string;
}

export async function registrar(params: RegistrarAuditoriaParams) {
  return prisma.logAuditoria.create({ data: params }).catch(() => null); // never throw
}

export async function listar(
  tenantId: string,
  filtros: {
    entidade?: string;
    usuarioId?: string;
    dataInicio?: string;
    dataFim?: string;
    limite?: number;
  }
) {
  const limite = Math.min(filtros.limite ?? 100, 200);
  const logs = await prisma.logAuditoria.findMany({
    where: {
      tenantId,
      ...(filtros.entidade && { entidade: filtros.entidade }),
      ...(filtros.usuarioId && { usuarioId: filtros.usuarioId }),
      ...((filtros.dataInicio || filtros.dataFim) && {
        criadoEm: {
          ...(filtros.dataInicio && { gte: new Date(filtros.dataInicio) }),
          ...(filtros.dataFim && { lte: new Date(filtros.dataFim + 'T23:59:59') }),
        },
      }),
    },
    orderBy: { criadoEm: 'desc' },
    take: limite,
  });

  // resolve usuario names
  const usuarioIds = [
    ...new Set(logs.map((l) => l.usuarioId).filter(Boolean) as string[]),
  ];
  const usuarios =
    usuarioIds.length > 0
      ? await prisma.usuario.findMany({
          where: { id: { in: usuarioIds } },
          select: { id: true, nome: true },
        })
      : [];
  const nomeById = Object.fromEntries(usuarios.map((u) => [u.id, u.nome]));

  return logs.map((l) => ({
    ...l,
    usuarioNome: l.usuarioId ? (nomeById[l.usuarioId] ?? 'Desconhecido') : 'Sistema',
  }));
}
