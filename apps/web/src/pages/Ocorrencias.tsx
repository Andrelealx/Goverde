import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Filter, Globe, EyeOff } from 'lucide-react';
import api from '../services/api';
import {
  statusOcorrenciaLabel,
  statusOcorrenciaColor,
  prioridadeLabel,
  prioridadeColor,
  categoriaLabel,
  formatDate,
} from '../utils/formatters';
import { cn } from '../utils/cn';

interface Ocorrencia {
  id: string;
  protocolo: string;
  titulo: string;
  categoria: string;
  status: string;
  prioridade: string;
  bairro: string | null;
  visivelPortal: boolean;
  criadoEm: string;
  fiscalResponsavel: { nome: string } | null;
}

const statusFiltros = ['', 'ABERTA', 'EM_ANALISE', 'EM_CAMPO', 'RESOLVIDA', 'ARQUIVADA'];

export default function Ocorrencias() {
  const [ocorrencias, setOcorrencias] = useState<Ocorrencia[]>([]);
  const [total, setTotal] = useState(0);
  const [status, setStatus] = useState('');
  const [carregando, setCarregando] = useState(true);

  const carregar = async (statusFiltro = '') => {
    setCarregando(true);
    try {
      const params = new URLSearchParams({ limite: '20' });
      if (statusFiltro) params.set('status', statusFiltro);
      const { data } = await api.get(`/api/ocorrencias?${params}`);
      setOcorrencias(data.data);
      setTotal(data.total);
    } finally {
      setCarregando(false);
    }
  };

  useEffect(() => {
    carregar(status);
  }, [status]);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <p className="text-sm text-gray-500">{total} ocorrência(s) encontrada(s)</p>
        <div className="flex items-center gap-3">
          {/* Filtro de status */}
          <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-lg px-3 py-2">
            <Filter size={14} className="text-gray-400" />
            <select
              className="text-sm border-none outline-none bg-transparent"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
            >
              <option value="">Todos os status</option>
              {statusFiltros.slice(1).map((s) => (
                <option key={s} value={s}>{statusOcorrenciaLabel[s]}</option>
              ))}
            </select>
          </div>
          <Link to="/ocorrencias/nova" className="btn-primary flex items-center gap-2">
            <Plus size={16} />
            Nova
          </Link>
        </div>
      </div>

      {/* Tabela */}
      <div className="card p-0 overflow-hidden">
        {carregando ? (
          <div className="flex items-center justify-center h-48">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
          </div>
        ) : ocorrencias.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <p className="text-sm">Nenhuma ocorrência encontrada</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Protocolo</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Título</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Categoria</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Prioridade</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Bairro</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Portal</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Data</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {ocorrencias.map((oc) => (
                  <tr key={oc.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">
                      <Link
                        to={`/ocorrencias/${oc.id}`}
                        className="font-mono text-primary hover:underline text-xs"
                      >
                        {oc.protocolo}
                      </Link>
                    </td>
                    <td className="px-4 py-3">
                      <Link to={`/ocorrencias/${oc.id}`} className="hover:text-primary font-medium">
                        {oc.titulo}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-gray-500">
                      {categoriaLabel[oc.categoria] ?? oc.categoria}
                    </td>
                    <td className="px-4 py-3">
                      <span className={cn('badge', statusOcorrenciaColor[oc.status])}>
                        {statusOcorrenciaLabel[oc.status]}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={cn('badge', prioridadeColor[oc.prioridade])}>
                        {prioridadeLabel[oc.prioridade]}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-500">{oc.bairro ?? '—'}</td>
                    <td className="px-4 py-3">
                      {oc.visivelPortal
                        ? <Globe size={14} className="text-green-500" />
                        : <EyeOff size={14} className="text-gray-300" />
                      }
                    </td>
                    <td className="px-4 py-3 text-gray-400 text-xs">{formatDate(oc.criadoEm)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
