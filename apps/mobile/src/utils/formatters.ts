export function formatDate(date: string | Date): string {
  return new Date(date).toLocaleDateString('pt-BR');
}

export function formatDateTime(date: string | Date): string {
  return new Date(date).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

export const statusOcorrenciaLabel: Record<string, string> = {
  ABERTA: 'Aberta', EM_ANALISE: 'Em Análise', EM_CAMPO: 'Em Campo', RESOLVIDA: 'Resolvida', ARQUIVADA: 'Arquivada',
};

export const statusOcorrenciaColor: Record<string, string> = {
  ABERTA: '#dc2626', EM_ANALISE: '#d97706', EM_CAMPO: '#2563eb', RESOLVIDA: '#16a34a', ARQUIVADA: '#6b7280',
};

export const categoriaLabel: Record<string, string> = {
  DESMATAMENTO: 'Desmatamento', QUEIMADA: 'Queimada', RESIDUOS_ILEGAIS: 'Resíduos Ilegais',
  POLUICAO_HIDRICA: 'Poluição Hídrica', POLUICAO_SONORA: 'Poluição Sonora', FAUNA: 'Fauna', OUTRO: 'Outro',
};

export const prioridadeColor: Record<string, string> = {
  BAIXA: '#6b7280', MEDIA: '#d97706', ALTA: '#ea580c', CRITICA: '#dc2626',
};

export function formatCurrency(value: number): string {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}
