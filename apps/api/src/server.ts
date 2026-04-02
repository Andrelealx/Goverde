import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import path from 'path';
import { env } from './config/env';
import { errorHandler } from './middlewares/error.middleware';

import authRoutes from './modules/auth/auth.routes';
import ocorrenciasRoutes from './modules/ocorrencias/ocorrencias.routes';
import licencasRoutes from './modules/licencas/licencas.routes';
import vistoriasRoutes from './modules/vistorias/vistorias.routes';
import dashboardRoutes from './modules/dashboard/dashboard.routes';
import relatoriosRoutes from './modules/relatorios/relatorios.routes';
import usuariosRoutes from './modules/usuarios/usuarios.routes';
import publicRoutes from './modules/public/public.routes';
import pontoRoutes from './modules/ponto/ponto.routes';
import notificacoesRoutes from './modules/notificacoes/notificacoes.routes';
import atestadosRoutes from './modules/atestados/atestados.routes';
import multasRoutes from './modules/multas/multas.routes';
import documentosRoutes from './modules/documentos/documentos.routes';
import iaRoutes from './modules/ia/ia.routes';

const app = express();

app.use(cors({
  origin: env.CORS_ORIGINS,
  credentials: true,
}));

app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ extended: true, limit: '5mb' }));
app.use(cookieParser());

// Servir uploads locais
app.use('/uploads', express.static(path.resolve(__dirname, '../../../uploads')));

// Health check
app.get('/health', (_req, res) => {
  const dbUrl = process.env.DATABASE_URL ?? '';
  const dbHost = dbUrl.match(/@([^:\/]+)/)?.[1] ?? 'unknown';
  res.json({ status: 'ok', timestamp: new Date().toISOString(), dbHost });
});

// Rotas
app.use('/api/auth', authRoutes);
app.use('/api/ocorrencias', ocorrenciasRoutes);
app.use('/api/licencas', licencasRoutes);
app.use('/api/vistorias', vistoriasRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/relatorios', relatoriosRoutes);
app.use('/api/usuarios', usuariosRoutes);
app.use('/api/public', publicRoutes);
app.use('/api/ponto', pontoRoutes);
app.use('/api/notificacoes', notificacoesRoutes);
app.use('/api/atestados', atestadosRoutes);
app.use('/api/multas', multasRoutes);
app.use('/api/documentos', documentosRoutes);
app.use('/api/ia', iaRoutes);

app.use(errorHandler);

app.listen(env.PORT, () => {
  console.log(`🌿 Goverde API rodando na porta ${env.PORT} [${env.NODE_ENV}]`);
});

export default app;
