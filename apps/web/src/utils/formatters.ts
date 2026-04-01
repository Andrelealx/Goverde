import { format, formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export function formatDate(date: string | Date): string {
  return format(new Date(date), "dd/MM/yyyy", { locale: ptBR });
}

export function formatDateTime(date: string | Date): string {
  return format(new Date(date), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR });
}

export function formatRelative(date: string | Date): string {
  return formatDistanceToNow(new Date(date), { locale: ptBR, addSuffix: true });
}

export const statusOcorrenciaLabel: Record<string, string> = {
  ABERTA: 'Aberta',
  EM_ANALISE: 'Em Análise',
  EM_CAMPO: 'Em Campo',
  RESOLVIDA: 'Resolvida',
  ARQUIVADA: 'Arquivada',
};

export const statusOcorrenciaColor: Record<string, string> = {
  ABERTA: 'bg-red-100 text-red-700',
  EM_ANALISE: 'bg-yellow-100 text-yellow-700',
  EM_CAMPO: 'bg-blue-100 text-blue-700',
  RESOLVIDA: 'bg-green-100 text-green-700',
  ARQUIVADA: 'bg-gray-100 text-gray-600',
};

export const prioridadeLabel: Record<string, string> = {
  BAIXA: 'Baixa',
  MEDIA: 'Média',
  ALTA: 'Alta',
  CRITICA: 'Crítica',
};

export const prioridadeColor: Record<string, string> = {
  BAIXA: 'bg-gray-100 text-gray-600',
  MEDIA: 'bg-yellow-100 text-yellow-700',
  ALTA: 'bg-orange-100 text-orange-700',
  CRITICA: 'bg-red-100 text-red-700',
};

export const categoriaLabel: Record<string, string> = {
  DESMATAMENTO: 'Desmatamento',
  QUEIMADA: 'Queimada',
  RESIDUOS_ILEGAIS: 'Resíduos Ilegais',
  POLUICAO_HIDRICA: 'Poluição Hídrica',
  POLUICAO_SONORA: 'Poluição Sonora',
  FAUNA: 'Fauna',
  OUTRO: 'Outro',
};

export const statusLicencaLabel: Record<string, string> = {
  SOLICITADA: 'Solicitada',
  EM_ANALISE: 'Em Análise',
  VISTORIA_AGENDADA: 'Vistoria Agendada',
  APROVADA: 'Aprovada',
  REPROVADA: 'Reprovada',
  CANCELADA: 'Cancelada',
  VENCIDA: 'Vencida',
};

export const statusLicencaColor: Record<string, string> = {
  SOLICITADA: 'bg-blue-100 text-blue-700',
  EM_ANALISE: 'bg-yellow-100 text-yellow-700',
  VISTORIA_AGENDADA: 'bg-purple-100 text-purple-700',
  APROVADA: 'bg-green-100 text-green-700',
  REPROVADA: 'bg-red-100 text-red-700',
  CANCELADA: 'bg-gray-100 text-gray-600',
  VENCIDA: 'bg-orange-100 text-orange-700',
};
