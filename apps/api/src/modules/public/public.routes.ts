import { Router, Request, Response, NextFunction } from 'express';
import prisma from '../../prisma/client';
import { AppError } from '../../middlewares/error.middleware';
import { denunciaPublicaSchema, solicitacaoLicencaPublicaSchema } from '@goverde/shared';
import { uploadFotos } from '../../middlewares/upload.middleware';

const router = Router();

async function getTenant(slug: string) {
  const tenant = await prisma.tenant.findUnique({ where: { slug } });
  if (!tenant || !tenant.ativo) throw new AppError('Município não encontrado', 404);
  return tenant;
}

async function gerarProtocolo(tenantId: string, tipo: string): Promise<string> {
  const ano = new Date().getFullYear();

  return prisma.$transaction(async (tx) => {
    const seq = await tx.protocoloSequencia.upsert({
      where: { tenantId_tipo_ano: { tenantId, tipo, ano } },
      update: { ultimo: { increment: 1 } },
      create: { tenantId, tipo, ano, ultimo: 1 },
    });

    return `${tipo}-${ano}-${String(seq.ultimo).padStart(5, '0')}`;
  });
}

// GET /api/public/:tenantSlug/ocorrencias — listagem pública
router.get('/:tenantSlug/ocorrencias', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const tenant = await getTenant(req.params.tenantSlug);
    const data = await prisma.ocorrencia.findMany({
      where: { tenantId: tenant.id, visivelPortal: true },
      select: {
        protocolo: true, titulo: true, categoria: true,
        status: true, bairro: true, criadoEm: true,
        latitude: true, longitude: true,
      },
      orderBy: { criadoEm: 'desc' },
      take: 200,
    });
    res.json({ data, total: data.length });
  } catch (err) { next(err); }
});

// GET /api/public/:tenantSlug/ocorrencia/:protocolo
router.get('/:tenantSlug/ocorrencia/:protocolo', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const tenant = await getTenant(req.params.tenantSlug);

    const ocorrencia = await prisma.ocorrencia.findFirst({
      where: { tenantId: tenant.id, protocolo: req.params.protocolo, visivelPortal: true },
      select: {
        protocolo: true,
        titulo: true,
        categoria: true,
        status: true,
        prioridade: true,
        bairro: true,
        endereco: true,
        criadoEm: true,
        atualizadoEm: true,
        fotos: { select: { url: true, nomeArquivo: true } },
        historicos: {
          where: { visivelCidadao: true },
          select: {
            statusAnterior: true,
            statusNovo: true,
            comentario: true,
            criadoEm: true,
          },
          orderBy: { criadoEm: 'asc' },
        },
      },
    });

    if (!ocorrencia) throw new AppError('Ocorrência não encontrada', 404);
    res.json(ocorrencia);
  } catch (err) {
    next(err);
  }
});

// POST /api/public/:tenantSlug/ocorrencias
router.post('/:tenantSlug/ocorrencias', uploadFotos, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const tenant = await getTenant(req.params.tenantSlug);

    const dados = denunciaPublicaSchema.parse(
      typeof req.body.dados === 'string' ? JSON.parse(req.body.dados) : req.body
    );

    const protocolo = await gerarProtocolo(tenant.id, 'OC');
    const arquivos = (req.files as Express.Multer.File[]) ?? [];

    const ocorrencia = await prisma.$transaction(async (tx) => {
      return tx.ocorrencia.create({
        data: {
          tenantId: tenant.id,
          protocolo,
          titulo: dados.titulo,
          descricao: dados.descricao,
          categoria: dados.categoria,
          prioridade: 'MEDIA',
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
              comentario: 'Denúncia registrada pelo cidadão',
              visivelCidadao: true,
            },
          },
        },
        select: { protocolo: true, criadoEm: true, status: true },
      });
    });

    res.status(201).json({
      protocolo: ocorrencia.protocolo,
      status: ocorrencia.status,
      mensagem: 'Denúncia registrada com sucesso! Guarde o número do protocolo para acompanhamento.',
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/public/:tenantSlug/licencas
router.post('/:tenantSlug/licencas', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const tenant = await getTenant(req.params.tenantSlug);
    const dados = solicitacaoLicencaPublicaSchema.parse(req.body);

    const protocolo = await gerarProtocolo(tenant.id, 'LIC');

    const licenca = await prisma.licencaAmbiental.create({
      data: {
        tenantId: tenant.id,
        protocolo,
        tipo: dados.tipo,
        requerente: dados.requerente,
        cpfCnpj: dados.cpfCnpj,
        atividade: dados.atividade,
        endereco: dados.endereco,
      },
      select: { protocolo: true, status: true, criadoEm: true },
    });

    res.status(201).json({
      protocolo: licenca.protocolo,
      status: licenca.status,
      mensagem: 'Solicitação registrada. Acompanhe pelo protocolo informado.',
    });
  } catch (err) {
    next(err);
  }
});

export default router;
