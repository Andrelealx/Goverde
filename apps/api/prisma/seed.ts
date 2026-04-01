import { PrismaClient, CategoriaOcorrencia, StatusOcorrencia, Prioridade, TipoLicenca, StatusLicenca } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Iniciando seed...');

  // Tenant
  const tenant = await prisma.tenant.upsert({
    where: { slug: 'guapimirim' },
    update: {},
    create: {
      nome: 'Prefeitura de Guapimirim',
      municipio: 'Guapimirim',
      estado: 'RJ',
      slug: 'guapimirim',
      plano: 'PROFISSIONAL',
    },
  });

  console.log('✅ Tenant criado:', tenant.nome);

  // Usuários
  const senhaAdmin = await bcrypt.hash('admin123', 10);
  const senhaFiscal = await bcrypt.hash('fiscal123', 10);

  const admin = await prisma.usuario.upsert({
    where: { tenantId_email: { tenantId: tenant.id, email: 'admin@guapimirim.goverde.com.br' } },
    update: {},
    create: {
      tenantId: tenant.id,
      nome: 'Administrador',
      email: 'admin@guapimirim.goverde.com.br',
      senhaHash: senhaAdmin,
      papel: 'SECRETARIO',
    },
  });

  const fiscal = await prisma.usuario.upsert({
    where: { tenantId_email: { tenantId: tenant.id, email: 'fiscal@guapimirim.goverde.com.br' } },
    update: {},
    create: {
      tenantId: tenant.id,
      nome: 'João Fiscal',
      email: 'fiscal@guapimirim.goverde.com.br',
      senhaHash: senhaFiscal,
      papel: 'FISCAL',
    },
  });

  console.log('✅ Usuários criados');

  // Ocorrências
  const ocorrencias: {
    titulo: string;
    descricao: string;
    categoria: CategoriaOcorrencia;
    status: StatusOcorrencia;
    prioridade: Prioridade;
    bairro: string;
    fiscalResponsavelId?: string;
  }[] = [
    {
      titulo: 'Desmatamento em área de preservação',
      descricao: 'Área de mata atlântica sendo desmatada ilegalmente no bairro Serra.',
      categoria: 'DESMATAMENTO',
      status: 'EM_CAMPO',
      prioridade: 'CRITICA',
      bairro: 'Serra',
      fiscalResponsavelId: fiscal.id,
    },
    {
      titulo: 'Queimada próxima a residências',
      descricao: 'Queimada de grande porte ameaçando residências do bairro.',
      categoria: 'QUEIMADA',
      status: 'ABERTA',
      prioridade: 'ALTA',
      bairro: 'Centro',
    },
    {
      titulo: 'Descarte irregular de resíduos',
      descricao: 'Empresa descartando lixo industrial em terreno baldio.',
      categoria: 'RESIDUOS_ILEGAIS',
      status: 'EM_ANALISE',
      prioridade: 'ALTA',
      bairro: 'Industrial',
      fiscalResponsavelId: fiscal.id,
    },
    {
      titulo: 'Poluição no Rio Guapi-Açu',
      descricao: 'Mancha escura observada nas águas do rio, possível esgoto industrial.',
      categoria: 'POLUICAO_HIDRICA',
      status: 'RESOLVIDA',
      prioridade: 'CRITICA',
      bairro: 'Ribeirão',
      fiscalResponsavelId: fiscal.id,
    },
    {
      titulo: 'Ruído excessivo de serraria',
      descricao: 'Serraria funcionando além do horário permitido causando poluição sonora.',
      categoria: 'POLUICAO_SONORA',
      status: 'ARQUIVADA',
      prioridade: 'MEDIA',
      bairro: 'Beira Rio',
    },
    {
      titulo: 'Animal silvestre em cativeiro ilegal',
      descricao: 'Denúncia de tucano e papagaio mantidos em gaiolas em residência.',
      categoria: 'FAUNA',
      status: 'ABERTA',
      prioridade: 'ALTA',
      bairro: 'Parque das Flores',
    },
    {
      titulo: 'Extração ilegal de areia',
      descricao: 'Extração irregular de areia do leito do rio sem licença ambiental.',
      categoria: 'OUTRO',
      status: 'EM_ANALISE',
      prioridade: 'ALTA',
      bairro: 'Ribeirão',
      fiscalResponsavelId: fiscal.id,
    },
    {
      titulo: 'Queimada em área rural',
      descricao: 'Fogo ateado em pasto avança para mata nativa.',
      categoria: 'QUEIMADA',
      status: 'RESOLVIDA',
      prioridade: 'ALTA',
      bairro: 'Zona Rural',
      fiscalResponsavelId: fiscal.id,
    },
    {
      titulo: 'Esgoto despejado em córrego',
      descricao: 'Moradores relatam esgoto sem tratamento sendo despejado diretamente no córrego.',
      categoria: 'POLUICAO_HIDRICA',
      status: 'EM_CAMPO',
      prioridade: 'MEDIA',
      bairro: 'Jardim Esperança',
    },
    {
      titulo: 'Descarte de pneus em área pública',
      descricao: 'Centenas de pneus velhos descartados em área verde municipal.',
      categoria: 'RESIDUOS_ILEGAIS',
      status: 'ABERTA',
      prioridade: 'MEDIA',
      bairro: 'Alpina',
    },
  ];

  for (let i = 0; i < ocorrencias.length; i++) {
    const oc = ocorrencias[i];
    const ano = new Date().getFullYear();
    const protocolo = `OC-${ano}-${String(i + 1).padStart(5, '0')}`;

    await prisma.ocorrencia.upsert({
      where: { tenantId_protocolo: { tenantId: tenant.id, protocolo } },
      update: {},
      create: {
        tenantId: tenant.id,
        protocolo,
        titulo: oc.titulo,
        descricao: oc.descricao,
        categoria: oc.categoria,
        status: oc.status,
        prioridade: oc.prioridade,
        bairro: oc.bairro,
        fiscalResponsavelId: oc.fiscalResponsavelId,
        historicos: {
          create: {
            statusNovo: 'ABERTA',
            comentario: 'Ocorrência registrada',
            visivelCidadao: true,
          },
        },
      },
    });
  }

  // Sequência de protocolo
  await prisma.protocoloSequencia.upsert({
    where: { tenantId_tipo_ano: { tenantId: tenant.id, tipo: 'OC', ano: new Date().getFullYear() } },
    update: { ultimo: 10 },
    create: { tenantId: tenant.id, tipo: 'OC', ano: new Date().getFullYear(), ultimo: 10 },
  });

  console.log('✅ Ocorrências criadas');

  // Licenças
  const licencas: { tipo: TipoLicenca; requerente: string; cpfCnpj: string; atividade: string; endereco: string; status: StatusLicenca }[] = [
    {
      tipo: 'OPERACAO',
      requerente: 'Indústria Madeireira Guapi Ltda',
      cpfCnpj: '12.345.678/0001-90',
      atividade: 'Processamento de madeira e beneficiamento',
      endereco: 'Rua das Madeireiras, 100 - Zona Industrial',
      status: 'APROVADA',
    },
    {
      tipo: 'INSTALACAO',
      requerente: 'Posto de Combustíveis Beira Rio',
      cpfCnpj: '98.765.432/0001-10',
      atividade: 'Comércio varejista de combustíveis',
      endereco: 'Av. Principal, 500 - Centro',
      status: 'EM_ANALISE',
    },
    {
      tipo: 'SIMPLIFICADA',
      requerente: 'Maria Silva',
      cpfCnpj: '123.456.789-00',
      atividade: 'Pequena criação de animais domésticos',
      endereco: 'Rua das Flores, 45 - Parque das Flores',
      status: 'APROVADA',
    },
    {
      tipo: 'LOCALIZACAO',
      requerente: 'Mineradora Serra Verde S.A.',
      cpfCnpj: '11.222.333/0001-44',
      atividade: 'Extração de areia e cascalho',
      endereco: 'Estrada Municipal km 15 - Zona Rural',
      status: 'VISTORIA_AGENDADA',
    },
    {
      tipo: 'OPERACAO',
      requerente: 'Transportadora Ecológica Ltda',
      cpfCnpj: '55.666.777/0001-88',
      atividade: 'Transporte de resíduos sólidos',
      endereco: 'Rod. BR-116, km 50 - Industrial',
      status: 'SOLICITADA',
    },
  ];

  for (let i = 0; i < licencas.length; i++) {
    const lic = licencas[i];
    const ano = new Date().getFullYear();
    const protocolo = `LIC-${ano}-${String(i + 1).padStart(5, '0')}`;

    await prisma.licencaAmbiental.upsert({
      where: { tenantId_protocolo: { tenantId: tenant.id, protocolo } },
      update: {},
      create: {
        tenantId: tenant.id,
        protocolo,
        tipo: lic.tipo,
        requerente: lic.requerente,
        cpfCnpj: lic.cpfCnpj,
        atividade: lic.atividade,
        endereco: lic.endereco,
        status: lic.status,
        fiscalResponsavelId: lic.status !== 'SOLICITADA' ? fiscal.id : undefined,
        dataValidade: lic.status === 'APROVADA' ? new Date(Date.now() + 365 * 24 * 60 * 60 * 1000) : undefined,
      },
    });
  }

  await prisma.protocoloSequencia.upsert({
    where: { tenantId_tipo_ano: { tenantId: tenant.id, tipo: 'LIC', ano: new Date().getFullYear() } },
    update: { ultimo: 5 },
    create: { tenantId: tenant.id, tipo: 'LIC', ano: new Date().getFullYear(), ultimo: 5 },
  });

  console.log('✅ Licenças criadas');
  console.log('\n🎉 Seed concluído!');
  console.log('\nCredenciais de acesso:');
  console.log('  Admin: admin@guapimirim.goverde.com.br / admin123');
  console.log('  Fiscal: fiscal@guapimirim.goverde.com.br / fiscal123');
  console.log('  Tenant slug: guapimirim');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
