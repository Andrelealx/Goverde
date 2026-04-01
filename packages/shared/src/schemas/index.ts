import { z } from 'zod';

// ─── AUTH ─────────────────────────────────────────────

export const loginSchema = z.object({
  email: z.string().email('E-mail inválido'),
  senha: z.string().min(6, 'Senha deve ter no mínimo 6 caracteres'),
});

export type LoginInput = z.infer<typeof loginSchema>;

// ─── OCORRÊNCIAS ──────────────────────────────────────

export const categoriaOcorrenciaValues = [
  'DESMATAMENTO',
  'QUEIMADA',
  'RESIDUOS_ILEGAIS',
  'POLUICAO_HIDRICA',
  'POLUICAO_SONORA',
  'FAUNA',
  'OUTRO',
] as const;

export const statusOcorrenciaValues = [
  'ABERTA',
  'EM_ANALISE',
  'EM_CAMPO',
  'RESOLVIDA',
  'ARQUIVADA',
] as const;

export const prioridadeValues = ['BAIXA', 'MEDIA', 'ALTA', 'CRITICA'] as const;

export const criarOcorrenciaSchema = z.object({
  titulo: z.string().min(5, 'Título deve ter no mínimo 5 caracteres').max(200),
  descricao: z.string().min(10, 'Descrição deve ter no mínimo 10 caracteres'),
  categoria: z.enum(categoriaOcorrenciaValues),
  prioridade: z.enum(prioridadeValues).default('MEDIA'),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
  endereco: z.string().max(300).optional(),
  bairro: z.string().max(100).optional(),
  nomeDenunciante: z.string().max(200).optional(),
  contatoDenunciante: z.string().max(100).optional(),
});

export type CriarOcorrenciaInput = z.infer<typeof criarOcorrenciaSchema>;

export const atualizarStatusOcorrenciaSchema = z.object({
  status: z.enum(statusOcorrenciaValues),
  comentario: z.string().max(1000).optional(),
  visivelCidadao: z.boolean().default(false),
});

export type AtualizarStatusOcorrenciaInput = z.infer<typeof atualizarStatusOcorrenciaSchema>;

export const atribuirFiscalSchema = z.object({
  fiscalId: z.string().cuid('ID de fiscal inválido'),
});

export type AtribuirFiscalInput = z.infer<typeof atribuirFiscalSchema>;

export const filtrosOcorrenciaSchema = z.object({
  status: z.enum(statusOcorrenciaValues).optional(),
  categoria: z.enum(categoriaOcorrenciaValues).optional(),
  prioridade: z.enum(prioridadeValues).optional(),
  bairro: z.string().optional(),
  fiscalId: z.string().optional(),
  cursor: z.string().optional(),
  limite: z.coerce.number().min(1).max(100).default(20),
});

export type FiltrosOcorrenciaInput = z.infer<typeof filtrosOcorrenciaSchema>;

// ─── DENÚNCIA PÚBLICA ─────────────────────────────────

export const denunciaPublicaSchema = z.object({
  titulo: z.string().min(5).max(200),
  descricao: z.string().min(10),
  categoria: z.enum(categoriaOcorrenciaValues),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  endereco: z.string().max(300).optional(),
  bairro: z.string().max(100).optional(),
  nomeDenunciante: z.string().max(200).optional(),
  contatoDenunciante: z.string().max(100).optional(),
});

export type DenunciaPublicaInput = z.infer<typeof denunciaPublicaSchema>;

// ─── LICENÇAS ─────────────────────────────────────────

export const tipoLicencaValues = [
  'INSTALACAO',
  'OPERACAO',
  'LOCALIZACAO',
  'SIMPLIFICADA',
] as const;

export const statusLicencaValues = [
  'SOLICITADA',
  'EM_ANALISE',
  'VISTORIA_AGENDADA',
  'APROVADA',
  'REPROVADA',
  'CANCELADA',
  'VENCIDA',
] as const;

export const criarLicencaSchema = z.object({
  tipo: z.enum(tipoLicencaValues),
  requerente: z.string().min(3).max(200),
  cpfCnpj: z.string().min(11).max(18),
  atividade: z.string().min(5).max(300),
  endereco: z.string().min(5).max(300),
  dataValidade: z.string().datetime().optional(),
});

export type CriarLicencaInput = z.infer<typeof criarLicencaSchema>;

export const atualizarStatusLicencaSchema = z.object({
  status: z.enum(statusLicencaValues),
  dataValidade: z.string().datetime().optional(),
});

export type AtualizarStatusLicencaInput = z.infer<typeof atualizarStatusLicencaSchema>;

// ─── VISTORIAS ────────────────────────────────────────

export const statusVistoriaValues = ['AGENDADA', 'REALIZADA', 'CANCELADA'] as const;

export const criarVistoriaSchema = z.object({
  licencaId: z.string().cuid().optional(),
  ocorrenciaId: z.string().cuid().optional(),
  fiscalId: z.string().cuid('ID de fiscal inválido'),
  dataAgendada: z.string().datetime(),
  observacoes: z.string().max(1000).optional(),
});

export type CriarVistoriaInput = z.infer<typeof criarVistoriaSchema>;

export const atualizarVistoriaSchema = z.object({
  status: z.enum(statusVistoriaValues),
  dataRealizada: z.string().datetime().optional(),
  observacoes: z.string().max(1000).optional(),
});

export type AtualizarVistoriaInput = z.infer<typeof atualizarVistoriaSchema>;

// ─── USUÁRIOS ─────────────────────────────────────────

export const papelValues = ['ADMIN_SISTEMA', 'SECRETARIO', 'FISCAL', 'OPERADOR'] as const;

export const criarUsuarioSchema = z.object({
  nome: z.string().min(3).max(200),
  email: z.string().email('E-mail inválido'),
  senha: z.string().min(6, 'Senha deve ter no mínimo 6 caracteres'),
  papel: z.enum(papelValues).default('FISCAL'),
});

export type CriarUsuarioInput = z.infer<typeof criarUsuarioSchema>;

export const atualizarUsuarioSchema = z.object({
  nome: z.string().min(3).max(200).optional(),
  papel: z.enum(papelValues).optional(),
  senha: z.string().min(6).optional(),
});

export type AtualizarUsuarioInput = z.infer<typeof atualizarUsuarioSchema>;

// ─── SOLICITAÇÃO DE LICENÇA PÚBLICA ───────────────────

export const solicitacaoLicencaPublicaSchema = z.object({
  tipo: z.enum(tipoLicencaValues),
  requerente: z.string().min(3).max(200),
  cpfCnpj: z.string().min(11).max(18),
  atividade: z.string().min(5).max(300),
  endereco: z.string().min(5).max(300),
});

export type SolicitacaoLicencaPublicaInput = z.infer<typeof solicitacaoLicencaPublicaSchema>;
