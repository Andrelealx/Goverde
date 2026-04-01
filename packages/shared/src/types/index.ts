export type Plano = 'BASICO' | 'PROFISSIONAL' | 'ENTERPRISE';

export type Papel = 'ADMIN_SISTEMA' | 'SECRETARIO' | 'FISCAL' | 'OPERADOR';

export type CategoriaOcorrencia =
  | 'DESMATAMENTO'
  | 'QUEIMADA'
  | 'RESIDUOS_ILEGAIS'
  | 'POLUICAO_HIDRICA'
  | 'POLUICAO_SONORA'
  | 'FAUNA'
  | 'OUTRO';

export type StatusOcorrencia =
  | 'ABERTA'
  | 'EM_ANALISE'
  | 'EM_CAMPO'
  | 'RESOLVIDA'
  | 'ARQUIVADA';

export type Prioridade = 'BAIXA' | 'MEDIA' | 'ALTA' | 'CRITICA';

export type TipoLicenca =
  | 'INSTALACAO'
  | 'OPERACAO'
  | 'LOCALIZACAO'
  | 'SIMPLIFICADA';

export type StatusLicenca =
  | 'SOLICITADA'
  | 'EM_ANALISE'
  | 'VISTORIA_AGENDADA'
  | 'APROVADA'
  | 'REPROVADA'
  | 'CANCELADA'
  | 'VENCIDA';

export type StatusVistoria = 'AGENDADA' | 'REALIZADA' | 'CANCELADA';

export interface PaginatedResponse<T> {
  data: T[];
  nextCursor: string | null;
  total: number;
}

export interface ApiError {
  message: string;
  errors?: Record<string, string[]>;
}

export interface AuthTokens {
  accessToken: string;
}

export interface JwtPayload {
  sub: string;
  tenantId: string;
  papel: Papel;
  email: string;
}

export interface TenantDTO {
  id: string;
  nome: string;
  municipio: string;
  estado: string;
  slug: string;
  plano: Plano;
  ativo: boolean;
  criadoEm: string;
}

export interface UsuarioDTO {
  id: string;
  tenantId: string;
  nome: string;
  email: string;
  papel: Papel;
  ativo: boolean;
  criadoEm: string;
}

export interface OcorrenciaFotoDTO {
  id: string;
  url: string;
  nomeArquivo: string;
  criadoEm: string;
}

export interface OcorrenciaHistoricoDTO {
  id: string;
  statusAnterior: StatusOcorrencia | null;
  statusNovo: StatusOcorrencia;
  comentario: string | null;
  visivelCidadao: boolean;
  criadoEm: string;
  usuario: { id: string; nome: string } | null;
}

export interface OcorrenciaDTO {
  id: string;
  tenantId: string;
  protocolo: string;
  titulo: string;
  descricao: string;
  categoria: CategoriaOcorrencia;
  status: StatusOcorrencia;
  prioridade: Prioridade;
  latitude: number | null;
  longitude: number | null;
  endereco: string | null;
  bairro: string | null;
  nomeDenunciante: string | null;
  contatoDenunciante: string | null;
  fiscalResponsavel: { id: string; nome: string } | null;
  fotos: OcorrenciaFotoDTO[];
  historicos: OcorrenciaHistoricoDTO[];
  criadoEm: string;
  atualizadoEm: string;
}

export interface LicencaAmbientalDTO {
  id: string;
  tenantId: string;
  protocolo: string;
  tipo: TipoLicenca;
  requerente: string;
  cpfCnpj: string;
  atividade: string;
  endereco: string;
  status: StatusLicenca;
  dataValidade: string | null;
  fiscalResponsavel: { id: string; nome: string } | null;
  criadoEm: string;
  atualizadoEm: string;
}

export interface VistoriaDTO {
  id: string;
  tenantId: string;
  licencaId: string | null;
  ocorrenciaId: string | null;
  fiscalId: string;
  fiscal: { id: string; nome: string };
  dataAgendada: string;
  dataRealizada: string | null;
  status: StatusVistoria;
  observacoes: string | null;
  criadoEm: string;
}

export interface DashboardResumoDTO {
  totalOcorrencias: number;
  ocorrenciasAbertas: number;
  ocorrenciasResolvidas: number;
  totalLicencas: number;
  licencasVencendo: number;
  totalVistorias: number;
  vistoriasPendentes: number;
}
