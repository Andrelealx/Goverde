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
