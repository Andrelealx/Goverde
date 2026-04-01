import { Router, Response, NextFunction } from 'express';
import { autenticar, autorizar, AuthRequest } from '../../middlewares/auth.middleware';
import { validarTenant } from '../../middlewares/tenant.middleware';
import * as service from './ponto.service';
import * as sdr from './sdr.service';
import { z } from 'zod';

const router = Router();
router.use(autenticar, validarTenant);

const registrarPontoSchema = z.object({
  tipo: z.enum(['ENTRADA', 'SAIDA', 'ALMOCO_SAIDA', 'ALMOCO_VOLTA']),
  latitude: z.number(),
  longitude: z.number(),
  precisao: z.number().optional(),
  enderecoAprox: z.string().optional(),
  verificacaoFacial: z.boolean().default(false),
  similaridade: z.number().min(0).max(1).optional(),
  fotoCaptura: z.string().optional(),
});

// GET /api/ponto/resumo — meu resumo do dia
router.get('/resumo', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const data = await service.resumoPontosUsuario(req.usuario!.tenantId, req.usuario!.sub);
    res.json(data);
  } catch (err) { next(err); }
});

// POST /api/ponto — registrar ponto
router.post('/', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const dados = registrarPontoSchema.parse(req.body);
    const ponto = await service.registrarPonto(req.usuario!.sub, req.usuario!.tenantId, dados);
    res.status(201).json(ponto);
  } catch (err) { next(err); }
});

// GET /api/ponto/hoje — todos os pontos de hoje (secretário)
router.get('/hoje', autorizar('SECRETARIO', 'ADMIN_SISTEMA'), async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const data = await service.listarPontosHoje(req.usuario!.tenantId, req.query.usuarioId as string);
    res.json(data);
  } catch (err) { next(err); }
});

// GET /api/ponto/relatorio?dataInicio=&dataFim=&usuarioId=
router.get('/relatorio', autorizar('SECRETARIO', 'ADMIN_SISTEMA'), async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { dataInicio, dataFim, usuarioId } = req.query as Record<string, string>;
    const data = await service.listarPontosPorPeriodo(
      req.usuario!.tenantId,
      dataInicio ? new Date(dataInicio) : new Date(Date.now() - 30 * 86400000),
      dataFim ? new Date(dataFim) : new Date(),
      usuarioId
    );
    res.json(data);
  } catch (err) { next(err); }
});

// POST /api/ponto/perfil-facial — salvar descritores faciais
router.post('/perfil-facial', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { descritores, fotoUrl } = z.object({
      descritores: z.array(z.array(z.number())),
      fotoUrl: z.string(),
    }).parse(req.body);
    const perfil = await service.salvarPerfilFacial(req.usuario!.sub, descritores, fotoUrl);
    res.json(perfil);
  } catch (err) { next(err); }
});

// GET /api/ponto/perfil-facial — buscar meu perfil
router.get('/perfil-facial', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const perfil = await service.buscarPerfilFacial(req.usuario!.sub);
    res.json(perfil ?? null);
  } catch (err) { next(err); }
});

// GET /api/ponto/saldo — meu saldo de banco de horas
router.get('/saldo', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const saldo = await sdr.buscarSaldoBancoHoras(req.usuario!.sub);
    res.json(saldo ?? { saldoTotal: 0 });
  } catch (err) { next(err); }
});

// GET /api/ponto/espelho?ano=&mes= — espelho de ponto mensal (próprio)
router.get('/espelho', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const agora = new Date();
    const ano = parseInt(req.query.ano as string) || agora.getFullYear();
    const mes = parseInt(req.query.mes as string) || agora.getMonth() + 1;
    const data = await sdr.espelhoPontoMensal(req.usuario!.tenantId, req.usuario!.sub, ano, mes);
    res.json(data);
  } catch (err) { next(err); }
});

// GET /api/ponto/espelho/:usuarioId — espelho de outro usuário (secretário)
router.get('/espelho/:usuarioId', autorizar('SECRETARIO', 'ADMIN_SISTEMA'), async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const agora = new Date();
    const ano = parseInt(req.query.ano as string) || agora.getFullYear();
    const mes = parseInt(req.query.mes as string) || agora.getMonth() + 1;
    const data = await sdr.espelhoPontoMensal(req.usuario!.tenantId, req.params.usuarioId, ano, mes);
    res.json(data);
  } catch (err) { next(err); }
});

// POST /api/ponto/processar-sdr — processar banco de horas de um dia
router.post('/processar-sdr', autorizar('SECRETARIO', 'ADMIN_SISTEMA'), async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { usuarioId, data } = z.object({
      usuarioId: z.string(),
      data: z.string().transform((v) => new Date(v)),
    }).parse(req.body);
    const resultado = await sdr.processarBancoHorasDia(usuarioId, req.usuario!.tenantId, data);
    res.json(resultado);
  } catch (err) { next(err); }
});

// GET /api/ponto/historico-saldo/:usuarioId
router.get('/historico-saldo/:usuarioId', autorizar('SECRETARIO', 'ADMIN_SISTEMA'), async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const data = await sdr.historicoSaldos(req.usuario!.tenantId, req.params.usuarioId);
    res.json(data);
  } catch (err) { next(err); }
});

export default router;
