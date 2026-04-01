import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FileText, Plus, CheckCircle, XCircle, Clock, Upload, X } from 'lucide-react';
import api from '../../services/api';
import { useAuthStore } from '../../stores/auth.store';

const statusConfig: Record<string, { label: string; color: string; icon: React.ComponentType<any> }> = {
  PENDENTE: { label: 'Pendente', color: 'bg-yellow-100 text-yellow-700', icon: Clock },
  APROVADO: { label: 'Aprovado', color: 'bg-green-100 text-green-700', icon: CheckCircle },
  REJEITADO: { label: 'Rejeitado', color: 'bg-red-100 text-red-600', icon: XCircle },
};

interface Atestado {
  id: string;
  dataInicio: string;
  dataFim: string;
  diasAfastamento: number;
  cid?: string;
  medicoNome?: string;
  arquivoUrl?: string;
  status: string;
  observacao?: string;
  criadoEm: string;
  usuario?: { nome: string; email: string };
}

export default function Atestados() {
  const { usuario } = useAuthStore();
  const isGestor = ['SECRETARIO', 'ADMIN_SISTEMA'].includes(usuario?.papel ?? '');
  const [atestados, setAtestados] = useState<Atestado[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [modal, setModal] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [form, setForm] = useState({
    dataInicio: '',
    dataFim: '',
    cid: '',
    medicoNome: '',
    observacao: '',
  });
  const [arquivo, setArquivo] = useState<File | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    carregar();
  }, []);

  const carregar = async () => {
    setCarregando(true);
    try {
      const url = isGestor ? '/api/atestados' : '/api/atestados/meus';
      const { data } = await api.get(url);
      setAtestados(data);
    } catch {} finally {
      setCarregando(false);
    }
  };

  const enviar = async () => {
    if (!form.dataInicio || !form.dataFim) return;
    setSalvando(true);
    try {
      let arquivoUrl: string | undefined;
      if (arquivo) {
        const fd = new FormData();
        fd.append('arquivo', arquivo);
        const { data } = await api.post('/api/documentos/upload', fd);
        arquivoUrl = data.url;
      }
      await api.post('/api/atestados', { ...form, arquivoUrl: arquivoUrl || undefined });
      setModal(false);
      setForm({ dataInicio: '', dataFim: '', cid: '', medicoNome: '', observacao: '' });
      setArquivo(null);
      await carregar();
    } catch {} finally {
      setSalvando(false);
    }
  };

  const atualizarStatus = async (id: string, status: 'APROVADO' | 'REJEITADO') => {
    try {
      await api.patch(`/api/atestados/${id}/status`, { status });
      await carregar();
    } catch {}
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-sora font-semibold text-gray-800 flex items-center gap-2">
          <FileText size={18} className="text-primary" />
          Atestados Médicos
        </h3>
        <button onClick={() => setModal(true)} className="btn-primary flex items-center gap-2 text-sm py-2">
          <Plus size={15} />
          Enviar Atestado
        </button>
      </div>

      {carregando ? (
        <div className="flex justify-center py-8">
          <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full" />
        </div>
      ) : atestados.length === 0 ? (
        <div className="card text-center py-10 text-gray-400 text-sm">Nenhum atestado enviado.</div>
      ) : (
        <div className="space-y-3">
          {atestados.map((a) => {
            const cfg = statusConfig[a.status] ?? statusConfig.PENDENTE;
            const StatusIcon = cfg.icon;
            return (
              <motion.div
                key={a.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="card flex flex-col sm:flex-row sm:items-center gap-4"
              >
                <div className="flex-1 space-y-1">
                  {isGestor && a.usuario && (
                    <p className="text-xs font-semibold text-primary">{a.usuario.nome}</p>
                  )}
                  <div className="flex items-center gap-2">
                    <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full ${cfg.color}`}>
                      <StatusIcon size={11} />
                      {cfg.label}
                    </span>
                    <span className="text-xs text-gray-500">
                      {new Date(a.dataInicio).toLocaleDateString('pt-BR')} — {new Date(a.dataFim).toLocaleDateString('pt-BR')}
                    </span>
                    <span className="text-xs bg-gray-100 text-gray-600 px-1.5 rounded">
                      {a.diasAfastamento} dia{a.diasAfastamento !== 1 ? 's' : ''}
                    </span>
                  </div>
                  {a.medicoNome && <p className="text-xs text-gray-400">Dr(a). {a.medicoNome}{a.cid ? ` · CID: ${a.cid}` : ''}</p>}
                  {a.observacao && <p className="text-xs text-gray-400 italic">{a.observacao}</p>}
                  {a.arquivoUrl && (
                    <a href={a.arquivoUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-primary underline">
                      Ver documento
                    </a>
                  )}
                </div>

                {isGestor && a.status === 'PENDENTE' && (
                  <div className="flex gap-2 shrink-0">
                    <button
                      onClick={() => atualizarStatus(a.id, 'APROVADO')}
                      className="flex items-center gap-1 text-xs px-3 py-1.5 bg-green-50 text-green-700 rounded-lg hover:bg-green-100"
                    >
                      <CheckCircle size={12} /> Aprovar
                    </button>
                    <button
                      onClick={() => atualizarStatus(a.id, 'REJEITADO')}
                      className="flex items-center gap-1 text-xs px-3 py-1.5 bg-red-50 text-red-600 rounded-lg hover:bg-red-100"
                    >
                      <XCircle size={12} /> Rejeitar
                    </button>
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Modal envio */}
      <AnimatePresence>
        {modal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-md space-y-4"
            >
              <div className="flex items-center justify-between">
                <h4 className="font-sora font-semibold text-gray-800">Enviar Atestado</h4>
                <button onClick={() => setModal(false)} className="text-gray-400 hover:text-gray-600">
                  <X size={20} />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Data início *</label>
                  <input type="date" className="input text-sm" value={form.dataInicio} onChange={(e) => setForm({ ...form, dataInicio: e.target.value })} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Data fim *</label>
                  <input type="date" className="input text-sm" value={form.dataFim} onChange={(e) => setForm({ ...form, dataFim: e.target.value })} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">CID</label>
                  <input type="text" placeholder="Ex: A09" className="input text-sm" value={form.cid} onChange={(e) => setForm({ ...form, cid: e.target.value })} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Nome do médico</label>
                  <input type="text" className="input text-sm" value={form.medicoNome} onChange={(e) => setForm({ ...form, medicoNome: e.target.value })} />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Observações</label>
                <textarea rows={2} className="input text-sm resize-none" value={form.observacao} onChange={(e) => setForm({ ...form, observacao: e.target.value })} />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Anexar documento (PDF/imagem)</label>
                <input ref={fileRef} type="file" accept=".pdf,.jpg,.jpeg,.png" className="hidden" onChange={(e) => setArquivo(e.target.files?.[0] ?? null)} />
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  className="w-full border-2 border-dashed border-gray-200 rounded-lg py-3 text-sm text-gray-500 hover:border-primary hover:text-primary transition-colors flex items-center justify-center gap-2"
                >
                  <Upload size={15} />
                  {arquivo ? arquivo.name : 'Clique para selecionar arquivo'}
                </button>
              </div>

              <div className="flex gap-3 pt-2">
                <button onClick={() => setModal(false)} className="btn-secondary flex-1 text-sm">Cancelar</button>
                <button onClick={enviar} disabled={salvando || !form.dataInicio || !form.dataFim} className="btn-primary flex-1 text-sm">
                  {salvando ? 'Enviando...' : 'Enviar'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
