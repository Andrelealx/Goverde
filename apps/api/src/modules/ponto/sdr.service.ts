import prisma from '../../prisma/client';

interface DiaCalculo {
  data: Date;
  pontos: Array<{ tipo: string; criadoEm: Date }>;
  horasTrabalhadas: number;
  horasEsperadas: number;
  saldo: number;
  temAtestado: boolean;
}

/** Calcula horas trabalhadas a partir dos registros de ponto do dia */
export function calcularHorasDia(pontos: Array<{ tipo: string; criadoEm: Date }>): number {
  const sorted = [...pontos].sort((a, b) => a.criadoEm.getTime() - b.criadoEm.getTime());

  let totalMs = 0;
  let entrada: Date | null = null;
  let saidaAlmoco: Date | null = null;

  for (const p of sorted) {
    if (p.tipo === 'ENTRADA') {
      entrada = p.criadoEm;
    } else if (p.tipo === 'ALMOCO_SAIDA' && entrada) {
      totalMs += p.criadoEm.getTime() - entrada.getTime();
      saidaAlmoco = p.criadoEm;
      entrada = null;
    } else if (p.tipo === 'ALMOCO_VOLTA') {
      entrada = p.criadoEm;
      saidaAlmoco = null;
    } else if (p.tipo === 'SAIDA' && entrada) {
      totalMs += p.criadoEm.getTime() - entrada.getTime();
      entrada = null;
    }
  }

  return totalMs / (1000 * 60 * 60);
}

/** Processa e persiste o banco de horas de um dia para um usuário */
export async function processarBancoHorasDia(
  usuarioId: string,
  tenantId: string,
  data: Date
) {
  const usuario = await prisma.usuario.findUnique({
    where: { id: usuarioId },
    select: { jornadaHoras: true, toleranciaMinutos: true },
  });
  if (!usuario) throw new Error('Usuário não encontrado');

  const inicio = new Date(data);
  inicio.setHours(0, 0, 0, 0);
  const fim = new Date(data);
  fim.setHours(23, 59, 59, 999);

  const pontos = await prisma.registroPonto.findMany({
    where: { usuarioId, tenantId, criadoEm: { gte: inicio, lte: fim } },
    orderBy: { criadoEm: 'asc' },
  });

  // Verificar se há atestado que cobre esse dia
  const atestado = await prisma.atestado.findFirst({
    where: {
      usuarioId,
      tenantId,
      status: 'APROVADO',
      dataInicio: { lte: inicio },
      dataFim: { gte: inicio },
    },
  });

  const horasTrabalhadas = calcularHorasDia(pontos);
  const horasEsperadas = atestado ? 0 : usuario.jornadaHoras;
  const tolerancia = usuario.toleranciaMinutos / 60;

  let saldo: number;
  if (atestado) {
    saldo = 0; // atestado: sem débito nem crédito
  } else if (pontos.length === 0) {
    saldo = -horasEsperadas; // falta
  } else {
    const diff = horasTrabalhadas - horasEsperadas;
    // Dentro da tolerância considera exato
    saldo = Math.abs(diff) <= tolerancia ? 0 : diff;
  }

  const registro = await prisma.bancoHoras.upsert({
    where: { usuarioId_data: { usuarioId, data: inicio } },
    update: { horasTrabalhadas, horasEsperadas, saldo },
    create: { usuarioId, tenantId, data: inicio, horasTrabalhadas, horasEsperadas, saldo },
  });

  // Atualiza saldo total
  const aggregado = await prisma.bancoHoras.aggregate({
    where: { usuarioId, tenantId },
    _sum: { saldo: true },
  });

  await prisma.saldoBancoHoras.upsert({
    where: { usuarioId },
    update: { saldoTotal: aggregado._sum.saldo ?? 0 },
    create: { usuarioId, tenantId, saldoTotal: aggregado._sum.saldo ?? 0 },
  });

  return registro;
}

/** Espelho de ponto mensal com totais */
export async function espelhoPontoMensal(
  tenantId: string,
  usuarioId: string,
  ano: number,
  mes: number
) {
  const inicio = new Date(ano, mes - 1, 1, 0, 0, 0);
  const fim = new Date(ano, mes, 0, 23, 59, 59);

  const [usuario, pontos, atestados] = await Promise.all([
    prisma.usuario.findUnique({
      where: { id: usuarioId },
      select: { nome: true, email: true, jornadaHoras: true, toleranciaMinutos: true },
    }),
    prisma.registroPonto.findMany({
      where: { tenantId, usuarioId, criadoEm: { gte: inicio, lte: fim } },
      orderBy: { criadoEm: 'asc' },
    }),
    prisma.atestado.findMany({
      where: { usuarioId, tenantId, status: 'APROVADO', dataInicio: { lte: fim }, dataFim: { gte: inicio } },
    }),
  ]);

  if (!usuario) throw new Error('Usuário não encontrado');

  // Agrupa pontos por dia
  const porDia: Record<string, typeof pontos> = {};
  for (const p of pontos) {
    const key = p.criadoEm.toISOString().split('T')[0];
    if (!porDia[key]) porDia[key] = [];
    porDia[key].push(p);
  }

  // Dias úteis do mês (seg-sex)
  const dias: DiaCalculo[] = [];
  const cur = new Date(inicio);
  while (cur <= fim) {
    const dow = cur.getDay();
    if (dow >= 1 && dow <= 5) {
      const key = cur.toISOString().split('T')[0];
      const pontosdia = porDia[key] ?? [];
      const curDate = new Date(cur);

      const temAtestado = atestados.some(
        (a) => a.dataInicio <= curDate && a.dataFim >= curDate
      );

      const horasTrabalhadas = calcularHorasDia(pontosdia);
      const horasEsperadas = temAtestado ? 0 : usuario.jornadaHoras;
      const tolerancia = usuario.toleranciaMinutos / 60;

      let saldo: number;
      if (temAtestado) {
        saldo = 0;
      } else if (pontosdia.length === 0) {
        saldo = -horasEsperadas;
      } else {
        const diff = horasTrabalhadas - horasEsperadas;
        saldo = Math.abs(diff) <= tolerancia ? 0 : diff;
      }

      dias.push({
        data: new Date(cur),
        pontos: pontosdia.map((p) => ({ tipo: p.tipo, criadoEm: p.criadoEm })),
        horasTrabalhadas,
        horasEsperadas,
        saldo,
        temAtestado,
      });
    }
    cur.setDate(cur.getDate() + 1);
  }

  const totalHorasTrabalhadas = dias.reduce((s, d) => s + d.horasTrabalhadas, 0);
  const totalHorasEsperadas = dias.reduce((s, d) => s + d.horasEsperadas, 0);
  const totalSaldo = dias.reduce((s, d) => s + d.saldo, 0);
  const totalHorasExtras = dias.reduce((s, d) => s + Math.max(0, d.saldo), 0);
  const totalFaltas = dias.reduce((s, d) => s + Math.max(0, -d.saldo), 0);

  return {
    usuario,
    ano,
    mes,
    dias,
    totais: {
      horasTrabalhadas: totalHorasTrabalhadas,
      horasEsperadas: totalHorasEsperadas,
      saldo: totalSaldo,
      horasExtras: totalHorasExtras,
      faltas: totalFaltas,
    },
  };
}

export async function buscarSaldoBancoHoras(usuarioId: string) {
  return prisma.saldoBancoHoras.findUnique({ where: { usuarioId } });
}

export async function historicoSaldos(tenantId: string, usuarioId: string, limite = 30) {
  return prisma.bancoHoras.findMany({
    where: { tenantId, usuarioId },
    orderBy: { data: 'desc' },
    take: limite,
  });
}

export async function processarMesCompleto(
  tenantId: string,
  usuarioId: string,
  ano: number,
  mes: number
) {
  const inicio = new Date(ano, mes - 1, 1);
  const fim = new Date(ano, mes, 0);
  const cur = new Date(inicio);

  while (cur <= fim) {
    const dow = cur.getDay();
    if (dow >= 1 && dow <= 5) {
      await processarBancoHorasDia(usuarioId, tenantId, new Date(cur));
    }
    cur.setDate(cur.getDate() + 1);
  }
}
