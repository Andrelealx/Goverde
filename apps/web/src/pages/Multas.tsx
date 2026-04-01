import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Scale, Plus, Search, X, DollarSign, AlertTriangle, CheckCircle, Clock } from 'lucide-react';
import api from '../services/api';
import { useAuthStore } from '../stores/auth.store';

const statusConfig: Record<string, { label: string; color: string }> = {
  EMITIDA: { label: 'Emitida', color: 'bg-blue-100 text-blue-700' },
  NOTIFICADA: { label: 'Notificada', color: 'bg-yellow-100 text-yellow-700' },
  PAGA: { label: 'Paga', color: 'bg-green-100 text-green-700' },
  CANCELADA: { label: 'Cancelada', color: 'bg-gray-100 text-gray-600' },
  VENCIDA: { label: 'Vencida', color: 'bg-red-100 text-red-600' },
};

interface AutoInfracao {
  id: string;
  numero: string;
  autuadoNome: string;
  autuadoCpfCnpj: string;
  autuadoEndereco: string;
  descricao: string;
  artigos?: string;
  valorMulta: number;
  dataInfracao: string;
  dataVencimento: string;
  status: string;
  dataPagamento?: string;
  criadoEm: string;
  fiscal: { id: string; nome: string };
}

interface Resumo {
  total: number;
  emitidas: number;
  pagas: number;
  vencidas: number;
  valorTotal: number;
  valorRecebido: number;
}

const FORM_INICIAL = {
  autuadoNome: '',
  autuadoCpfCnpj: '',
  autuadoEndereco: '',
  descricao: '',
  artigos: '',
  valorMulta: '',
  dataInfracao: '',
  dataVencimento: '',
};

export default function Multas() {
  const { usuario } = useAuthStore();
  const isGestor = ['SECRETARIO', 'ADMIN_SISTEMA'].includes(usuario?.papel ?? '');
  const [multas, setMultas] = useState<AutoInfracao[]>([]);
  const [resumo, setResumo] = useState<Resumo | null>(null);
  const [busca, setBusca] = useState('');
  const [statusFiltro, setStatusFiltro] = useState('');
  const [carregando, setCarregando] = useState(true);
  const [modalNova, setModalNova] = useState(false);
  const [detalhe, setDetalhe] = useState<AutoInfracao | null>(null);
  const [form, setForm] = useState(FORM_INICIAL);
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    carregar();
    carregarResumo();
  }, [busca, statusFiltro]);

  const carregar = async () => {
    setCarregando(true);
    try {
      const params = new URLSearchParams();
      if (busca) params.set('busca', busca);
      if (statusFiltro) params.set('status', statusFiltro);
      const { data } = await api.get(`/api/multas?${params}`);
      setMultas(data);
    } catch {} finally {
      setCarregando(false);
    }
  };

  const carregarResumo = async () => {
    try {
      const { data } = await api.get('/api/multas/resumo');
      setResumo(data);
    } catch {}
  };

  const salvar = async () => {
    setSalvando(true);
    try {
      await api.post('/api/multas', {
        ...form,
        valorMulta: parseFloat(form.valorMulta),
        dataInfracao: new Date(form.dataInfracao).toISOString(),
        dataVencimento: new Date(form.dataVencimento).toISOString(),
      });
      setModalNova(false);
      setForm(FORM_INICIAL);
      await carregar();
      await carregarResumo();
    } catch {} finally {
      setSalvando(false);
    }
  };

  const atualizarStatus = async (id: string, status: string, dataPagamento?: string) => {
    try {
      await api.patch(`/api/multas/${id}/status`, {
        status,
        ...(dataPagamento && { dataPagamento: new Date(dataPagamento).toISOString() }),
      });
      setDetalhe(null);
      await carregar();
      await carregarResumo();
    } catch {}
  };

  const formatMoeda = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  return (
    <div className="space-y-6">
      {/* Cabeçalho */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-sora font-bold text-gray-800 text-xl flex items-center gap-2">
            <Scale size={22} className="text-primary" />
            Auto de Infração
          </h2>
          <p className="text-sm text-gray-400 mt-0.5">Gestão de multas e autos de infração ambiental</p>
        </div>
        {['SECRETARIO', 'ADMIN_SISTEMA', 'FISCAL'].includes(usuario?.papel ?? '') && (
          <button onClick={() => setModalNova(true)} className="btn-primary flex items-center gap-2">
            <Plus size={16} />
            Emitir Auto
          </button>
        )}
      </div>

      {/* KPIs */}
      {resumo && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: 'Total', value: resumo.total, icon: Scale, color: 'text-gray-600', bg: 'bg-gray-50' },
            { label: 'Emitidas', value: resumo.emitidas, icon: AlertTriangle, color: 'text-blue-600', bg: 'bg-blue-50' },
            { label: 'Pagas', value: resumo.pagas, icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-50' },
            { label: 'Vencidas', value: resumo.vencidas, icon: Clock, color: 'text-red-600', bg: 'bg-red-50' },
          ].map(({ label, value, icon: Icon, color, bg }) => (
            <div key={label} className={`card flex items-center gap-3 ${bg}`}>
              <Icon size={22} className={color} />
              <div>
                <p className="text-xs text-gray-400">{label}</p>
                <p className={`text-2xl font-bold ${color}`}>{value}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {resumo && (
        <div className="grid grid-cols-2 gap-4">
          <div className="card bg-orange-50">
            <p className="text-xs text-gray-400">Valor Total Emitido</p>
            <p className="text-xl font-bold text-orange-700">{formatMoeda(resumo.valorTotal)}</p>
          </div>
          <div className="card bg-green-50">
            <p className="text-xs text-gray-400">Valor Recebido</p>
            <p className="text-xl font-bold text-green-700">{formatMoeda(resumo.valorRecebido)}</p>
          </div>
        </div>
      )}

      {/* Filtros */}
      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar por número, autuado..."
            className="input pl-9 text-sm"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
          />
        </div>
        <select className="input text-sm w-auto" value={statusFiltro} onChange={(e) => setStatusFiltro(e.target.value)}>
          <option value="">Todos os status</option>
          {Object.entries(statusConfig).map(([k, v]) => (
            <option key={k} value={k}>{v.label}</option>
          ))}
        </select>
      </div>

      {/* Lista */}
      {carregando ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin h-7 w-7 border-2 border-primary border-t-transparent rounded-full" />
        </div>
      ) : multas.length === 0 ? (
        <div className="card text-center py-12 text-gray-400 text-sm">Nenhum auto de infração encontrado.</div>
      ) : (
        <div className="space-y-3">
          {multas.map((m) => {
            const cfg = statusConfig[m.status] ?? statusConfig.EMITIDA;
            return (
              <motion.div
                key={m.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                onClick={() => setDetalhe(m)}
                className="card cursor-pointer hover:shadow-md transition-shadow flex flex-col sm:flex-row sm:items-center gap-3"
              >
                <div className="flex-1 space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sm font-bold text-gray-800">{m.numero}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${cfg.color}`}>{cfg.label}</span>
                  </div>
                  <p className="text-sm text-gray-700">{m.autuadoNome} · <span className="text-gray-400 text-xs">{m.autuadoCpfCnpj}</span></p>
                  <p className="text-xs text-gray-400 line-clamp-1">{m.descricao}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="font-bold text-orange-600">{formatMoeda(m.valorMulta)}</p>
                  <p className="text-xs text-gray-400">Vence: {new Date(m.dataVencimento).toLocaleDateString('pt-BR')}</p>
                  <p className="text-xs text-gray-400">{m.fiscal.nome}</p>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Modal nova multa */}
      <AnimatePresence>
        {modalNova && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-lg space-y-4 max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between">
                <h4 className="font-sora font-semibold text-gray-800">Emitir Auto de Infração</h4>
                <button onClick={() => setModalNova(false)}><X size={20} className="text-gray-400" /></button>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Nome do autuado *</label>
                <input className="input text-sm" value={form.autuadoNome} onChange={(e) => setForm({ ...form, autuadoNome: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">CPF/CNPJ *</label>
                  <input className="input text-sm" value={form.autuadoCpfCnpj} onChange={(e) => setForm({ ...form, autuadoCpfCnpj: e.target.value })} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Valor da multa (R$) *</label>
                  <input type="number" min="0" step="0.01" className="input text-sm" value={form.valorMulta} onChange={(e) => setForm({ ...form, valorMulta: e.target.value })} />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Endereço *</label>
                <input className="input text-sm" value={form.autuadoEndereco} onChange={(e) => setForm({ ...form, autuadoEndereco: e.target.value })} />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Descrição da infração *</label>
                <textarea rows={3} className="input text-sm resize-none" value={form.descricao} onChange={(e) => setForm({ ...form, descricao: e.target.value })} />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Artigos infringidos</label>
                <input className="input text-sm" placeholder="Ex: Art. 55 da Lei 9.605/98" value={form.artigos} onChange={(e) => setForm({ ...form, artigos: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Data da infração *</label>
                  <input type="date" className="input text-sm" value={form.dataInfracao} onChange={(e) => setForm({ ...form, dataInfracao: e.target.value })} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Data de vencimento *</label>
                  <input type="date" className="input text-sm" value={form.dataVencimento} onChange={(e) => setForm({ ...form, dataVencimento: e.target.value })} />
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button onClick={() => setModalNova(false)} className="btn-secondary flex-1 text-sm">Cancelar</button>
                <button
                  onClick={salvar}
                  disabled={salvando || !form.autuadoNome || !form.descricao || !form.valorMulta}
                  className="btn-primary flex-1 text-sm"
                >
                  {salvando ? 'Emitindo...' : 'Emitir'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Detalhe / ações */}
      <AnimatePresence>
        {detalhe && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/40 flex items-end sm:items-center justify-center p-4"
          >
            <motion.div
              initial={{ y: 40, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 40, opacity: 0 }}
              className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-md space-y-4"
            >
              <div className="flex justify-between items-start">
                <div>
                  <span className="font-mono font-bold text-gray-800">{detalhe.numero}</span>
                  <span className={`ml-2 text-xs px-2 py-0.5 rounded-full ${statusConfig[detalhe.status]?.color}`}>
                    {statusConfig[detalhe.status]?.label}
                  </span>
                </div>
                <button onClick={() => setDetalhe(null)}><X size={20} className="text-gray-400" /></button>
              </div>

              <div className="space-y-1 text-sm">
                <p><span className="text-gray-400 text-xs">Autuado:</span> {detalhe.autuadoNome}</p>
                <p><span className="text-gray-400 text-xs">CPF/CNPJ:</span> {detalhe.autuadoCpfCnpj}</p>
                <p><span className="text-gray-400 text-xs">Endereço:</span> {detalhe.autuadoEndereco}</p>
                <p><span className="text-gray-400 text-xs">Infração:</span> {detalhe.descricao}</p>
                {detalhe.artigos && <p><span className="text-gray-400 text-xs">Artigos:</span> {detalhe.artigos}</p>}
                <p><span className="text-gray-400 text-xs">Valor:</span> <strong className="text-orange-600">{detalhe.valorMulta.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</strong></p>
                <p><span className="text-gray-400 text-xs">Vencimento:</span> {new Date(detalhe.dataVencimento).toLocaleDateString('pt-BR')}</p>
                <p><span className="text-gray-400 text-xs">Fiscal:</span> {detalhe.fiscal.nome}</p>
              </div>

              {isGestor && detalhe.status !== 'PAGA' && detalhe.status !== 'CANCELADA' && (
                <div className="flex gap-2 flex-wrap">
                  {detalhe.status === 'EMITIDA' && (
                    <button onClick={() => atualizarStatus(detalhe.id, 'NOTIFICADA')} className="btn-secondary text-xs px-3 py-1.5">
                      Marcar Notificada
                    </button>
                  )}
                  <button
                    onClick={() => {
                      const data = prompt('Data de pagamento (AAAA-MM-DD):');
                      if (data) atualizarStatus(detalhe.id, 'PAGA', data);
                    }}
                    className="flex items-center gap-1 text-xs px-3 py-1.5 bg-green-50 text-green-700 rounded-lg hover:bg-green-100"
                  >
                    <DollarSign size={12} /> Registrar Pagamento
                  </button>
                  <button onClick={() => atualizarStatus(detalhe.id, 'CANCELADA')} className="flex items-center gap-1 text-xs px-3 py-1.5 bg-gray-50 text-gray-600 rounded-lg hover:bg-gray-100">
                    <X size={12} /> Cancelar
                  </button>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
