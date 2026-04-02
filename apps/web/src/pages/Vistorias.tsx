import { useEffect, useState } from 'react';
import { Pencil, Plus, ClipboardList } from 'lucide-react';
import { formatDateTime } from '../utils/formatters';
import { cn } from '../utils/cn';
import api from '../services/api';

interface Vistoria {
  id: string;
  dataAgendada: string;
  dataRealizada: string | null;
  status: string;
  observacoes: string | null;
  fiscal: { id: string; nome: string };
  licenca: { id: string; protocolo: string; requerente: string } | null;
}

interface Usuario {
  id: string;
  nome: string;
  ativo: boolean;
}

interface Licenca {
  id: string;
  protocolo: string;
  requerente: string;
}

const statusLabel: Record<string, string> = {
  AGENDADA: 'Agendada',
  REALIZADA: 'Realizada',
  CANCELADA: 'Cancelada',
};

const statusColor: Record<string, string> = {
  AGENDADA: 'bg-blue-100 text-blue-700',
  REALIZADA: 'bg-green-100 text-green-700',
  CANCELADA: 'bg-gray-100 text-gray-500',
};

function ModalCriar({
  usuarios,
  licencas,
  onClose,
  onSuccess,
}: {
  usuarios: Usuario[];
  licencas: Licenca[];
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [fiscalId, setFiscalId] = useState('');
  const [licencaId, setLicencaId] = useState('');
  const [dataAgendada, setDataAgendada] = useState('');
  const [observacoes, setObservacoes] = useState('');
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState('');

  const fiscaisAtivos = usuarios.filter((u) => u.ativo);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!fiscalId || !dataAgendada) {
      setErro('Fiscal e data/hora são obrigatórios.');
      return;
    }
    setSalvando(true);
    setErro('');
    try {
      await api.post('/api/vistorias', {
        fiscalId,
        licencaId: licencaId || undefined,
        dataAgendada: new Date(dataAgendada).toISOString(),
        observacoes: observacoes || undefined,
      });
      onSuccess();
      onClose();
    } catch {
      setErro('Erro ao criar vistoria. Tente novamente.');
    } finally {
      setSalvando(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg p-6 space-y-5">
        <h2 className="text-lg font-semibold text-gray-900">Nova Vistoria</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Fiscal *</label>
            <select
              value={fiscalId}
              onChange={(e) => setFiscalId(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              required
            >
              <option value="">Selecionar fiscal...</option>
              {fiscaisAtivos.map((u) => (
                <option key={u.id} value={u.id}>{u.nome}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Licença (opcional)</label>
            <select
              value={licencaId}
              onChange={(e) => setLicencaId(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="">Nenhuma</option>
              {licencas.map((l) => (
                <option key={l.id} value={l.id}>{l.protocolo} – {l.requerente}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Data/hora agendada *</label>
            <input
              type="datetime-local"
              value={dataAgendada}
              onChange={(e) => setDataAgendada(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Observações (opcional)</label>
            <textarea
              value={observacoes}
              onChange={(e) => setObservacoes(e.target.value)}
              rows={3}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary resize-none"
            />
          </div>

          {erro && <p className="text-sm text-red-500">{erro}</p>}

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 border border-gray-200 rounded-lg"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={salvando}
              className="px-4 py-2 text-sm bg-primary text-white rounded-lg hover:bg-primary/90 disabled:opacity-50"
            >
              {salvando ? 'Salvando...' : 'Criar Vistoria'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function ModalEditar({
  vistoria,
  onClose,
  onSuccess,
}: {
  vistoria: Vistoria;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [status, setStatus] = useState(vistoria.status);
  const [dataRealizada, setDataRealizada] = useState(
    vistoria.dataRealizada
      ? new Date(vistoria.dataRealizada).toISOString().slice(0, 16)
      : ''
  );
  const [observacoes, setObservacoes] = useState(vistoria.observacoes ?? '');
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSalvando(true);
    setErro('');
    try {
      await api.patch(`/api/vistorias/${vistoria.id}`, {
        status,
        dataRealizada: status === 'REALIZADA' && dataRealizada
          ? new Date(dataRealizada).toISOString()
          : undefined,
        observacoes: observacoes || undefined,
      });
      onSuccess();
      onClose();
    } catch {
      setErro('Erro ao atualizar vistoria. Tente novamente.');
    } finally {
      setSalvando(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg p-6 space-y-5">
        <h2 className="text-lg font-semibold text-gray-900">Editar Vistoria</h2>

        <div className="bg-gray-50 rounded-lg p-4 space-y-2 text-sm">
          <div className="flex gap-2">
            <span className="text-gray-500 w-32">Fiscal:</span>
            <span className="font-medium">{vistoria.fiscal.nome}</span>
          </div>
          <div className="flex gap-2">
            <span className="text-gray-500 w-32">Licença:</span>
            <span className="font-medium">
              {vistoria.licenca
                ? `${vistoria.licenca.protocolo} – ${vistoria.licenca.requerente}`
                : '—'}
            </span>
          </div>
          <div className="flex gap-2">
            <span className="text-gray-500 w-32">Data agendada:</span>
            <span className="font-medium">{formatDateTime(vistoria.dataAgendada)}</span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="AGENDADA">Agendada</option>
              <option value="REALIZADA">Realizada</option>
              <option value="CANCELADA">Cancelada</option>
            </select>
          </div>

          {status === 'REALIZADA' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Data realizada</label>
              <input
                type="datetime-local"
                value={dataRealizada}
                onChange={(e) => setDataRealizada(e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Observações</label>
            <textarea
              value={observacoes}
              onChange={(e) => setObservacoes(e.target.value)}
              rows={3}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary resize-none"
            />
          </div>

          {erro && <p className="text-sm text-red-500">{erro}</p>}

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 border border-gray-200 rounded-lg"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={salvando}
              className="px-4 py-2 text-sm bg-primary text-white rounded-lg hover:bg-primary/90 disabled:opacity-50"
            >
              {salvando ? 'Salvando...' : 'Salvar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function Vistorias() {
  const [vistorias, setVistorias] = useState<Vistoria[]>([]);
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [licencas, setLicencas] = useState<Licenca[]>([]);
  const [carregando, setCarregando] = useState(true);

  const [filtroStatus, setFiltroStatus] = useState('');
  const [filtroFiscal, setFiltroFiscal] = useState('');

  const [modalCriar, setModalCriar] = useState(false);
  const [vistoriaEditar, setVistoriaEditar] = useState<Vistoria | null>(null);

  async function carregar() {
    setCarregando(true);
    try {
      const [vRes, uRes, lRes] = await Promise.all([
        api.get('/api/vistorias'),
        api.get('/api/usuarios'),
        api.get('/api/licencas'),
      ]);
      setVistorias(vRes.data);
      setUsuarios(uRes.data);
      setLicencas(lRes.data?.items ?? lRes.data ?? []);
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    carregar();
  }, []);

  const vistoriasFiltradas = vistorias.filter((v) => {
    if (filtroStatus && v.status !== filtroStatus) return false;
    if (filtroFiscal && v.fiscal.id !== filtroFiscal) return false;
    return true;
  });

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <ClipboardList size={24} className="text-primary" />
            Vistorias
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">{vistorias.length} vistoria(s) registrada(s)</p>
        </div>
        <button
          onClick={() => setModalCriar(true)}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-white text-sm font-medium rounded-lg hover:bg-primary/90 transition-colors"
        >
          <Plus size={16} />
          Nova Vistoria
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <select
          value={filtroStatus}
          onChange={(e) => setFiltroStatus(e.target.value)}
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary bg-white"
        >
          <option value="">Todas as situações</option>
          <option value="AGENDADA">Agendada</option>
          <option value="REALIZADA">Realizada</option>
          <option value="CANCELADA">Cancelada</option>
        </select>

        <select
          value={filtroFiscal}
          onChange={(e) => setFiltroFiscal(e.target.value)}
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary bg-white"
        >
          <option value="">Todos os fiscais</option>
          {usuarios.map((u) => (
            <option key={u.id} value={u.id}>{u.nome}</option>
          ))}
        </select>
      </div>

      {/* Table */}
      <div className="card p-0 overflow-hidden">
        {carregando ? (
          <div className="flex items-center justify-center h-48">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
          </div>
        ) : vistoriasFiltradas.length === 0 ? (
          <div className="text-center py-16 text-gray-400 text-sm">Nenhuma vistoria encontrada</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Data Agendada</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Data Realizada</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Fiscal</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Licença</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {vistoriasFiltradas.map((v) => (
                  <tr key={v.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-xs whitespace-nowrap">{formatDateTime(v.dataAgendada)}</td>
                    <td className="px-4 py-3 text-xs text-gray-500 whitespace-nowrap">
                      {v.dataRealizada ? formatDateTime(v.dataRealizada) : '—'}
                    </td>
                    <td className="px-4 py-3 font-medium">{v.fiscal.nome}</td>
                    <td className="px-4 py-3 text-xs text-gray-500">
                      {v.licenca ? (
                        <>
                          <span className="font-mono text-primary">{v.licenca.protocolo}</span>
                          <span className="ml-1">· {v.licenca.requerente}</span>
                        </>
                      ) : '—'}
                    </td>
                    <td className="px-4 py-3">
                      <span className={cn('inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium', statusColor[v.status])}>
                        {statusLabel[v.status] ?? v.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => setVistoriaEditar(v)}
                        className="p-1.5 text-gray-400 hover:text-primary hover:bg-primary/10 rounded-lg transition-colors"
                        title="Editar vistoria"
                      >
                        <Pencil size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modals */}
      {modalCriar && (
        <ModalCriar
          usuarios={usuarios}
          licencas={licencas}
          onClose={() => setModalCriar(false)}
          onSuccess={carregar}
        />
      )}

      {vistoriaEditar && (
        <ModalEditar
          vistoria={vistoriaEditar}
          onClose={() => setVistoriaEditar(null)}
          onSuccess={carregar}
        />
      )}
    </div>
  );
}
