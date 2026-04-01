import { Router, Response, NextFunction } from 'express';
import { autenticar, AuthRequest } from '../../middlewares/auth.middleware';
import { validarTenant } from '../../middlewares/tenant.middleware';
import prisma from '../../prisma/client';

const router = Router();
router.use(autenticar, validarTenant);

// Clientes SSE por tenant
const clients = new Map<string, Set<Response>>();

export function notificarTenant(tenantId: string, evento: object) {
  const set = clients.get(tenantId);
  if (!set) return;
  const payload = `data: ${JSON.stringify(evento)}\n\n`;
  set.forEach((res) => {
    try { res.write(payload); } catch {}
  });
}

// GET /api/notificacoes/stream — SSE
router.get('/stream', (req: AuthRequest, res: Response) => {
  const tenantId = req.usuario!.tenantId;

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  if (!clients.has(tenantId)) clients.set(tenantId, new Set());
  clients.get(tenantId)!.add(res);

  // Ping a cada 30s
  const ping = setInterval(() => {
    try { res.write(':ping\n\n'); } catch {}
  }, 30000);

  req.on('close', () => {
    clearInterval(ping);
    clients.get(tenantId)?.delete(res);
  });
});

// GET /api/notificacoes — lista recentes
router.get('/', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const tenantId = req.usuario!.tenantId;
    const hoje = new Date(Date.now() - 7 * 86400000);

    const [ocAbertas, licVencendo, vistoriasHoje] = await prisma.$transaction([
      prisma.ocorrencia.count({ where: { tenantId, status: 'ABERTA', criadoEm: { gte: hoje } } }),
      prisma.licencaAmbiental.count({
        where: { tenantId, status: 'APROVADA', dataValidade: { lte: new Date(Date.now() + 30 * 86400000), gte: new Date() } },
      }),
      prisma.vistoria.count({
        where: {
          tenantId,
          status: 'AGENDADA',
          dataAgendada: { gte: new Date(new Date().setHours(0,0,0,0)), lte: new Date(new Date().setHours(23,59,59,999)) },
        },
      }),
    ]);

    const lista = [];
    if (ocAbertas > 0) lista.push({ tipo: 'alerta', mensagem: `${ocAbertas} ocorrência(s) abertas nos últimos 7 dias`, icone: 'alert' });
    if (licVencendo > 0) lista.push({ tipo: 'aviso', mensagem: `${licVencendo} licença(s) vencem em até 30 dias`, icone: 'clock' });
    if (vistoriasHoje > 0) lista.push({ tipo: 'info', mensagem: `${vistoriasHoje} vistoria(s) agendada(s) para hoje`, icone: 'calendar' });

    res.json(lista);
  } catch (err) { next(err); }
});

export default router;
