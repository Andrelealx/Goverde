import prisma from '../../prisma/client';

export async function resumo(tenantId: string) {
  const hoje = new Date();
  const em30Dias = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

  const [
    totalOcorrencias,
    ocorrenciasAbertas,
    ocorrenciasResolvidas,
    totalLicencas,
    licencasVencendo,
    totalVistorias,
    vistoriasPendentes,
  ] = await prisma.$transaction([
    prisma.ocorrencia.count({ where: { tenantId } }),
    prisma.ocorrencia.count({ where: { tenantId, status: { in: ['ABERTA', 'EM_ANALISE', 'EM_CAMPO'] } } }),
    prisma.ocorrencia.count({ where: { tenantId, status: 'RESOLVIDA' } }),
    prisma.licencaAmbiental.count({ where: { tenantId } }),
    prisma.licencaAmbiental.count({
      where: { tenantId, status: 'APROVADA', dataValidade: { lte: em30Dias, gte: hoje } },
    }),
    prisma.vistoria.count({ where: { tenantId } }),
    prisma.vistoria.count({ where: { tenantId, status: 'AGENDADA' } }),
  ]);

  return {
    totalOcorrencias,
    ocorrenciasAbertas,
    ocorrenciasResolvidas,
    totalLicencas,
    licencasVencendo,
    totalVistorias,
    vistoriasPendentes,
  };
}

export async function ocorrenciasPorMes(tenantId: string) {
  const resultado = await prisma.$queryRaw<{ mes: string; total: bigint }[]>`
    SELECT
      TO_CHAR("criadoEm", 'YYYY-MM') as mes,
      COUNT(*) as total
    FROM "Ocorrencia"
    WHERE "tenantId" = ${tenantId}
      AND "criadoEm" >= NOW() - INTERVAL '12 months'
    GROUP BY mes
    ORDER BY mes ASC
  `;

  return resultado.map((r) => ({ mes: r.mes, total: Number(r.total) }));
}

export async function ocorrenciasPorBairro(tenantId: string) {
  const resultado = await prisma.$queryRaw<{ bairro: string; total: bigint }[]>`
    SELECT
      COALESCE(bairro, 'Não informado') as bairro,
      COUNT(*) as total
    FROM "Ocorrencia"
    WHERE "tenantId" = ${tenantId}
    GROUP BY bairro
    ORDER BY total DESC
    LIMIT 10
  `;

  return resultado.map((r) => ({ bairro: r.bairro, total: Number(r.total) }));
}

export async function ocorrenciasPorCategoria(tenantId: string) {
  const resultado = await prisma.$queryRaw<{ categoria: string; total: bigint }[]>`
    SELECT
      categoria,
      COUNT(*) as total
    FROM "Ocorrencia"
    WHERE "tenantId" = ${tenantId}
    GROUP BY categoria
    ORDER BY total DESC
  `;

  return resultado.map((r) => ({ categoria: r.categoria, total: Number(r.total) }));
}

export async function desempenho(tenantId: string) {
  const agora = new Date();
  const inicioMesAtual = new Date(agora.getFullYear(), agora.getMonth(), 1);
  const inicioMesAnterior = new Date(agora.getFullYear(), agora.getMonth() - 1, 1);
  const fimMesAnterior = new Date(agora.getFullYear(), agora.getMonth(), 0);

  const [
    ocMesAtual,
    ocMesAnterior,
    resolvidasMesAtual,
    resolvidasMesAnterior,
    multasMesAtual,
    multasPagasMesAtual,
    vistoriasMesAtual,
    vistoriasRealizadasMesAtual,
    topFiscais,
    multasResumo,
  ] = await prisma.$transaction([
    prisma.ocorrencia.count({ where: { tenantId, criadoEm: { gte: inicioMesAtual } } }),
    prisma.ocorrencia.count({ where: { tenantId, criadoEm: { gte: inicioMesAnterior, lte: fimMesAnterior } } }),
    prisma.ocorrencia.count({ where: { tenantId, status: 'RESOLVIDA', atualizadoEm: { gte: inicioMesAtual } } }),
    prisma.ocorrencia.count({ where: { tenantId, status: 'RESOLVIDA', atualizadoEm: { gte: inicioMesAnterior, lte: fimMesAnterior } } }),
    prisma.autoInfracao.count({ where: { tenantId, criadoEm: { gte: inicioMesAtual } } }),
    prisma.autoInfracao.count({ where: { tenantId, status: 'PAGA', criadoEm: { gte: inicioMesAtual } } }),
    prisma.vistoria.count({ where: { tenantId, criadoEm: { gte: inicioMesAtual } } }),
    prisma.vistoria.count({ where: { tenantId, status: 'REALIZADA', criadoEm: { gte: inicioMesAtual } } }),
    prisma.ocorrencia.groupBy({
      by: ['fiscalResponsavelId'],
      where: { tenantId, status: 'RESOLVIDA', fiscalResponsavelId: { not: null } },
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } },
      take: 5,
    }),
    prisma.autoInfracao.aggregate({
      where: { tenantId },
      _sum: { valorMulta: true },
    }),
  ]);

  // Buscar nomes dos fiscais
  const fiscalIds = topFiscais.map((f) => f.fiscalResponsavelId!);
  const fiscaisNomes = await prisma.usuario.findMany({
    where: { id: { in: fiscalIds } },
    select: { id: true, nome: true },
  });
  const nomePorId = Object.fromEntries(fiscaisNomes.map((f) => [f.id, f.nome]));

  return {
    ocorrencias: {
      mesAtual: ocMesAtual,
      mesAnterior: ocMesAnterior,
      variacaoPercent:
        ocMesAnterior > 0
          ? Math.round(((ocMesAtual - ocMesAnterior) / ocMesAnterior) * 100)
          : null,
    },
    resolucoes: {
      mesAtual: resolvidasMesAtual,
      mesAnterior: resolvidasMesAnterior,
      variacaoPercent:
        resolvidasMesAnterior > 0
          ? Math.round(((resolvidasMesAtual - resolvidasMesAnterior) / resolvidasMesAnterior) * 100)
          : null,
    },
    multas: {
      mesAtual: multasMesAtual,
      pagas: multasPagasMesAtual,
      taxaPagamento:
        multasMesAtual > 0 ? Math.round((multasPagasMesAtual / multasMesAtual) * 100) : 0,
      totalArrecadado: multasResumo._sum.valorMulta ?? 0,
    },
    vistorias: {
      mesAtual: vistoriasMesAtual,
      realizadas: vistoriasRealizadasMesAtual,
      taxaRealizacao:
        vistoriasMesAtual > 0
          ? Math.round((vistoriasRealizadasMesAtual / vistoriasMesAtual) * 100)
          : 0,
    },
    topFiscais: topFiscais.map((f) => ({
      fiscalId: f.fiscalResponsavelId!,
      nome: nomePorId[f.fiscalResponsavelId!] ?? 'Desconhecido',
      resolucoes: typeof f._count === 'object' ? (f._count as { id: number }).id : 0,
    })),
  };
}
