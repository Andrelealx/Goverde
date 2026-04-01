import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, User, Globe, EyeOff } from 'lucide-react';
import api from '../services/api';
import {
  statusOcorrenciaLabel,
  statusOcorrenciaColor,
  prioridadeLabel,
  prioridadeColor,
  categoriaLabel,
  formatDateTime,
} from '../utils/formatters';
import { cn } from '../utils/cn';
import { statusOcorrenciaValues } from '@goverde/shared';

interface OcorrenciaDetalhe {
  id: string;
  protocolo: string;
  titulo: string;
  descricao: string;
  categoria: string;
  status: string;
  prioridade: string;
  bairro: string | null;
  endereco: string | null;
  nomeDenunciante: string | null;
  contatoDenunciante: string | null;
  visivelPortal: boolean;
  fiscalResponsavel: { id: string; nome: string } | null;
  fotos: { id: string; url: string; nomeArquivo: string }[];
  historicos: {
    id: string;
    statusAnterior: string | null;
    statusNovo: string;
    comentario: string | null;
    visivelCidadao: boolean;
    criadoEm: string;
    usuario: { nome: string } | null;
  }[];
  criadoEm: string;
  atualizadoEm: string;
}

export default function DetalheOcorrencia() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [ocorrencia, setOcorrencia] = useState<OcorrenciaDetalhe | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [novoStatus, setNovoStatus] = useState('');
  const [comentario, setComentario] = useState('');
  const [visivelCidadao, setVisivelCidadao] = useState(false);
  const [atualizando, setAtualizando] = useState(false);
  const [togglingVisibilidade, setTogglingVisibilidade] = useState(false);

  const carregar = async () => {
    const { data } = await api.get(`/api/ocorrencias/${id}`);
    setOcorrencia(data);
    setCarregando(false);
  };

  useEffect(() => {
    carregar();
  }, [id]);

  const atualizarStatus = async () => {
    if (!novoStatus) return;
    setAtualizando(true);
    try {
      await api.patch(`/api/ocorrencias/${id}/status`, {
        status: novoStatus,
        comentario: comentario || undefined,
        visivelCidadao,
      });
      setNovoStatus('');
      setComentario('');
      setVisivelCidadao(false);
      await carregar();
    } finally {
      setAtualizando(false);
    }
  };

  const alternarVisibilidade = async () => {
    if (!ocorrencia) return;
    setTogglingVisibilidade(true);
    try {
      const { data } = await api.patch(`/api/ocorrencias/${id}/visibilidade`);
      setOcorrencia((prev) => prev ? { ...prev, visivelPortal: data.visivelPortal } : prev);
    } finally {
      setTogglingVisibilidade(false);
    }
  };

  if (carregando || !ocorrencia) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={() => navigate('/ocorrencias')} className="p-1.5 hover:bg-gray-100 rounded-lg">
          <ArrowLeft size={18} />
        </button>
        <div>
          <p className="font-mono text-xs text-gray-400">{ocorrencia.protocolo}</p>
          <h2 className="font-sora font-semibold text-gray-800 text-lg">{ocorrencia.titulo}</h2>
        </div>
        <div className="ml-auto flex gap-2">
          <span className={cn('badge', statusOcorrenciaColor[ocorrencia.status])}>
            {statusOcorrenciaLabel[ocorrencia.status]}
          </span>
          <span className={cn('badge', prioridadeColor[ocorrencia.prioridade])}>
            {prioridadeLabel[ocorrencia.prioridade]}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Coluna principal */}
        <div className="lg:col-span-2 space-y-6">
          {/* Detalhes */}
          <div className="card space-y-4">
            <h3 className="font-sora font-medium text-gray-700">Detalhes</h3>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-gray-400 text-xs">Categoria</p>
                <p className="font-medium">{categoriaLabel[ocorrencia.categoria]}</p>
              </div>
              <div>
                <p className="text-gray-400 text-xs">Bairro</p>
                <p className="font-medium">{ocorrencia.bairro ?? '—'}</p>
              </div>
              <div>
                <p className="text-gray-400 text-xs">Endereço</p>
                <p className="font-medium">{ocorrencia.endereco ?? '—'}</p>
              </div>
              <div>
                <p className="text-gray-400 text-xs">Registrado em</p>
                <p className="font-medium">{formatDateTime(ocorrencia.criadoEm)}</p>
              </div>
            </div>
            <div>
              <p className="text-gray-400 text-xs mb-1">Descrição</p>
              <p className="text-sm text-gray-700">{ocorrencia.descricao}</p>
            </div>

            {(ocorrencia.nomeDenunciante || ocorrencia.contatoDenunciante) && (
              <div className="border-t pt-3">
                <p className="text-gray-400 text-xs mb-1">Denunciante</p>
                <p className="text-sm font-medium">{ocorrencia.nomeDenunciante}</p>
                <p className="text-sm text-gray-500">{ocorrencia.contatoDenunciante}</p>
              </div>
            )}
          </div>

          {/* Fotos */}
          {ocorrencia.fotos.length > 0 && (
            <div className="card">
              <h3 className="font-sora font-medium text-gray-700 mb-3">Fotos</h3>
              <div className="grid grid-cols-3 gap-2">
                {ocorrencia.fotos.map((foto) => (
                  <a key={foto.id} href={foto.url} target="_blank" rel="noreferrer">
                    <img
                      src={foto.url}
                      alt={foto.nomeArquivo}
                      className="w-full h-24 object-cover rounded-lg hover:opacity-90 transition-opacity"
                    />
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Histórico */}
          <div className="card">
            <h3 className="font-sora font-medium text-gray-700 mb-3">Histórico</h3>
            <div className="space-y-3">
              {ocorrencia.historicos.map((h) => (
                <div key={h.id} className="flex gap-3 text-sm">
                  <div className="flex flex-col items-center">
                    <div className="w-2 h-2 rounded-full bg-primary mt-1.5" />
                    <div className="flex-1 w-px bg-gray-100 mt-1" />
                  </div>
                  <div className="pb-3">
                    <div className="flex items-center gap-2">
                      <span className={cn('badge text-xs', statusOcorrenciaColor[h.statusNovo])}>
                        {statusOcorrenciaLabel[h.statusNovo]}
                      </span>
                      {h.visivelCidadao && (
                        <span className="text-xs text-blue-500">visível ao cidadão</span>
                      )}
                    </div>
                    {h.comentario && <p className="text-gray-600 mt-0.5">{h.comentario}</p>}
                    <p className="text-gray-400 text-xs mt-0.5">
                      {formatDateTime(h.criadoEm)}
                      {h.usuario && ` · ${h.usuario.nome}`}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Coluna lateral */}
        <div className="space-y-4">
          {/* Fiscal */}
          <div className="card">
            <h3 className="font-sora font-medium text-gray-700 mb-3">Fiscal Responsável</h3>
            {ocorrencia.fiscalResponsavel ? (
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center">
                  <User size={14} className="text-primary" />
                </div>
                <p className="text-sm font-medium">{ocorrencia.fiscalResponsavel.nome}</p>
              </div>
            ) : (
              <p className="text-sm text-gray-400">Não atribuído</p>
            )}
          </div>

          {/* Visibilidade no portal */}
          <div className="card">
            <h3 className="font-sora font-medium text-gray-700 mb-3">Portal do Cidadão</h3>
            <div className="flex items-start gap-3">
              <div className={cn(
                'w-10 h-10 rounded-xl flex items-center justify-center shrink-0',
                ocorrencia.visivelPortal ? 'bg-green-50' : 'bg-gray-100'
              )}>
                {ocorrencia.visivelPortal
                  ? <Globe size={18} className="text-green-600" />
                  : <EyeOff size={18} className="text-gray-400" />
                }
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-700">
                  {ocorrencia.visivelPortal ? 'Visível ao público' : 'Oculta ao público'}
                </p>
                <p className="text-xs text-gray-400 mt-0.5">
                  {ocorrencia.visivelPortal
                    ? 'Aparece no mapa e na consulta por protocolo'
                    : 'Somente visível para a equipe interna'
                  }
                </p>
              </div>
            </div>
            <button
              onClick={alternarVisibilidade}
              disabled={togglingVisibilidade}
              className={cn(
                'mt-3 w-full text-sm font-medium py-2 rounded-xl transition-colors',
                ocorrencia.visivelPortal
                  ? 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                  : 'bg-green-500 hover:bg-green-600 text-white'
              )}
            >
              {togglingVisibilidade
                ? 'Salvando...'
                : ocorrencia.visivelPortal
                  ? 'Ocultar do portal'
                  : 'Publicar no portal'
              }
            </button>
          </div>

          {/* Atualizar status */}
          <div className="card">
            <h3 className="font-sora font-medium text-gray-700 mb-3">Atualizar Status</h3>
            <div className="space-y-3">
              <select
                value={novoStatus}
                onChange={(e) => setNovoStatus(e.target.value)}
                className="input text-sm"
              >
                <option value="">Selecionar status...</option>
                {statusOcorrenciaValues.map((s) => (
                  <option key={s} value={s}>{statusOcorrenciaLabel[s]}</option>
                ))}
              </select>
              <textarea
                value={comentario}
                onChange={(e) => setComentario(e.target.value)}
                rows={3}
                className="input text-sm resize-none"
                placeholder="Comentário (opcional)"
              />
              <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
                <input
                  type="checkbox"
                  checked={visivelCidadao}
                  onChange={(e) => setVisivelCidadao(e.target.checked)}
                  className="rounded"
                />
                Visível ao cidadão
              </label>
              <button
                onClick={atualizarStatus}
                disabled={!novoStatus || atualizando}
                className="btn-primary w-full text-sm"
              >
                {atualizando ? 'Salvando...' : 'Salvar'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
