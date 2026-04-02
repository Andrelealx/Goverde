import { useEffect, useState } from 'react';
import { ShieldCheck, Search } from 'lucide-react';
import { formatDateTime } from '../utils/formatters';
import api from '../services/api';

interface LogAuditoria {
  id: string;
  tenantId: string;
  usuarioId: string | null;
  usuarioNome: string;
  acao: string;
  entidade: string;
  entidadeId: string | null;
  detalhes: Record<string, unknown> | null;
  ip: string | null;
  criadoEm: string;
}

interface Usuario {
  id: string;
  nome: string;
}

const acaoLabel: Record<string, string> = {
  STATUS_ATUALIZADO: 'Status atualizado',
  USUARIO_CRIADO: 'Usuário criado',
};

const entidadeLabel: Record<string, string> = {
  Ocorrencia: 'Ocorrência',
  LicencaAmbiental: 'Licença',
  Usuario: 'Usuário',
};

const entidadeOptions = [
  { value: '', label: 'Todas as entidades' },
  { value: 'Ocorrencia', label: 'Ocorrência' },
  { value: 'LicencaAmbiental', label: 'Licença' },
  { value: 'Usuario', label: 'Usuário' },
];

function DetalhesBadges({ detalhes }: { detalhes: Record<string, unknown> | null }) {
  if (!detalhes) return <span className="text-gray-300">—</span>;
  const entries = Object.entries(detalhes);
  if (entries.length === 0) return <span className="text-gray-300">—</span>;
  return (
    <div className="flex flex-wrap gap-1">
      {entries.map(([k, v]) => (
        <span
          key={k}
          className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-gray-100 text-gray-600 text-xs rounded"
        >
          <span className="text-gray-400">{k}:</span>
          <span className="font-medium">{String(v)}</span>
        </span>
      ))}
    </div>
  );
}

export default function Auditoria() {
  const [logs, setLogs] = useState<LogAuditoria[]>([]);
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [carregando, setCarregando] = useState(true);

  const [filtroEntidade, setFiltroEntidade] = useState('');
  const [filtroUsuario, setFiltroUsuario] = useState('');
  const [filtroDataInicio, setFiltroDataInicio] = useState('');
  const [filtroDataFim, setFiltroDataFim] = useState('');

  async function carregar() {
    setCarregando(true);
    try {
      const params = new URLSearchParams();
      if (filtroEntidade) params.set('entidade', filtroEntidade);
      if (filtroUsuario) params.set('usuarioId', filtroUsuario);
      if (filtroDataInicio) params.set('dataInicio', filtroDataInicio);
      if (filtroDataFim) params.set('dataFim', filtroDataFim);

      const { data } = await api.get(`/api/auditoria?${params.toString()}`);
      setLogs(data);
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    api.get('/api/usuarios').then(({ data }) => setUsuarios(data));
    carregar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleFiltrar(e: React.FormEvent) {
    e.preventDefault();
    carregar();
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <ShieldCheck size={24} className="text-primary" />
          Auditoria
        </h1>
        <p className="text-sm text-gray-500 mt-0.5">Registro de ações do sistema</p>
      </div>

      {/* Filters */}
      <form onSubmit={handleFiltrar} className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm">
        <div className="flex flex-wrap gap-3 items-end">
          <div className="flex-1 min-w-[160px]">
            <label className="block text-xs font-medium text-gray-500 mb-1">Entidade</label>
            <select
              value={filtroEntidade}
              onChange={(e) => setFiltroEntidade(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary bg-white"
            >
              {entidadeOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>

          <div className="flex-1 min-w-[160px]">
            <label className="block text-xs font-medium text-gray-500 mb-1">Usuário</label>
            <select
              value={filtroUsuario}
              onChange={(e) => setFiltroUsuario(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary bg-white"
            >
              <option value="">Todos os usuários</option>
              {usuarios.map((u) => (
                <option key={u.id} value={u.id}>{u.nome}</option>
              ))}
            </select>
          </div>

          <div className="flex-1 min-w-[140px]">
            <label className="block text-xs font-medium text-gray-500 mb-1">Data início</label>
            <input
              type="date"
              value={filtroDataInicio}
              onChange={(e) => setFiltroDataInicio(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <div className="flex-1 min-w-[140px]">
            <label className="block text-xs font-medium text-gray-500 mb-1">Data fim</label>
            <input
              type="date"
              value={filtroDataFim}
              onChange={(e) => setFiltroDataFim(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <button
            type="submit"
            className="flex items-center gap-2 px-4 py-2 bg-primary text-white text-sm font-medium rounded-lg hover:bg-primary/90 transition-colors shrink-0"
          >
            <Search size={15} />
            Filtrar
          </button>
        </div>
      </form>

      {/* Table */}
      <div className="card p-0 overflow-hidden">
        {carregando ? (
          <div className="flex items-center justify-center h-48">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
          </div>
        ) : logs.length === 0 ? (
          <div className="text-center py-16 text-gray-400 text-sm">
            Nenhum registro de auditoria encontrado
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase whitespace-nowrap">Data/Hora</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Usuário</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Ação</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Entidade</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase whitespace-nowrap">ID Entidade</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Detalhes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-xs text-gray-500 whitespace-nowrap">
                      {formatDateTime(log.criadoEm)}
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-medium text-gray-800">{log.usuarioNome}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700">
                        {acaoLabel[log.acao] ?? log.acao}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-600">
                      {entidadeLabel[log.entidade] ?? log.entidade}
                    </td>
                    <td className="px-4 py-3 text-xs font-mono text-gray-400 max-w-[120px] truncate">
                      {log.entidadeId ?? '—'}
                    </td>
                    <td className="px-4 py-3">
                      <DetalhesBadges detalhes={log.detalhes as Record<string, unknown> | null} />
                    </td>
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
