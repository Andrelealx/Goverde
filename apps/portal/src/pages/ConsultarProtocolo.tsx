import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import { ArrowLeft, Search, Loader2, CheckCircle, Clock, AlertCircle, MapPin, Image } from 'lucide-react';
import Header from '../components/Header';

const TENANT_SLUG = import.meta.env.VITE_TENANT_SLUG ?? 'guapimirim';
const API_URL = import.meta.env.VITE_API_URL ?? '';

const statusConfig: Record<string, { label: string; color: string; icon: typeof CheckCircle; prog: number }> = {
  ABERTA:     { label: 'Aberta',     color: 'bg-red-100 text-red-700 border-red-200',       icon: AlertCircle, prog: 10 },
  EM_ANALISE: { label: 'Em Análise', color: 'bg-yellow-100 text-yellow-700 border-yellow-200', icon: Clock,       prog: 35 },
  EM_CAMPO:   { label: 'Em Campo',   color: 'bg-blue-100 text-blue-700 border-blue-200',     icon: MapPin,      prog: 65 },
  RESOLVIDA:  { label: 'Resolvida',  color: 'bg-green-100 text-green-700 border-green-200',  icon: CheckCircle, prog: 100 },
  ARQUIVADA:  { label: 'Arquivada',  color: 'bg-gray-100 text-gray-600 border-gray-200',     icon: CheckCircle, prog: 100 },
};

const categoriaLabel: Record<string, string> = {
  DESMATAMENTO: '🌳 Desmatamento', QUEIMADA: '🔥 Queimada',
  RESIDUOS_ILEGAIS: '🗑️ Resíduos Ilegais', POLUICAO_HIDRICA: '💧 Poluição Hídrica',
  POLUICAO_SONORA: '🔊 Poluição Sonora', FAUNA: '🦜 Fauna', OUTRO: '❓ Outro',
};

interface Ocorrencia {
  protocolo: string; titulo: string; categoria: string; status: string;
  bairro: string | null; endereco: string | null; criadoEm: string;
  fotos?: { url: string; nomeArquivo: string }[];
  historicos: { statusNovo: string; comentario: string | null; criadoEm: string; visivelCidadao: boolean }[];
}

export default function ConsultarProtocolo() {
  const [protocolo, setProtocolo] = useState('');
  const [resultado, setResultado] = useState<Ocorrencia | null>(null);
  const [erro, setErro] = useState('');
  const [buscando, setBuscando] = useState(false);

  const buscar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!protocolo.trim()) return;
    setBuscando(true); setErro(''); setResultado(null);
    try {
      const { data } = await axios.get(`${API_URL}/api/public/${TENANT_SLUG}/ocorrencia/${protocolo.trim().toUpperCase()}`);
      setResultado(data);
    } catch {
      setErro('Protocolo não encontrado. Verifique o número e tente novamente.');
    } finally { setBuscando(false); }
  };

  const cfg = resultado ? statusConfig[resultado.status] ?? statusConfig.ABERTA : null;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header />
      <main className="max-w-2xl mx-auto w-full px-4 py-8 space-y-6">
        <div>
          <Link to="/" className="inline-flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-600 mb-4 transition-colors">
            <ArrowLeft size={15} /> Voltar
          </Link>
          <h1 className="font-sora font-bold text-2xl text-gray-800">Consultar Protocolo</h1>
          <p className="text-gray-400 text-sm mt-1">Acompanhe o andamento da sua denúncia</p>
        </div>

        <form onSubmit={buscar} className="flex gap-2">
          <input
            className="flex-1 border-2 border-gray-200 rounded-2xl px-4 py-3 text-sm font-mono uppercase focus:ring-0 focus:border-primary-400 outline-none tracking-wider placeholder:normal-case placeholder:tracking-normal"
            placeholder="Ex: OC-2026-00001"
            value={protocolo}
            onChange={(e) => setProtocolo(e.target.value)}
          />
          <button type="submit" disabled={buscando || !protocolo.trim()}
            className="px-5 py-3 bg-primary-500 text-white rounded-2xl disabled:opacity-40 hover:bg-primary-600 transition-colors flex items-center gap-2 font-medium text-sm">
            {buscando ? <Loader2 size={17} className="animate-spin" /> : <Search size={17} />}
            <span className="hidden sm:inline">Buscar</span>
          </button>
        </form>

        <AnimatePresence>
          {erro && (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="bg-red-50 border border-red-200 rounded-2xl px-4 py-3 text-sm text-red-600 flex items-center gap-2">
              <AlertCircle size={16} /> {erro}
            </motion.div>
          )}

          {resultado && cfg && (
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
              {/* Card principal */}
              <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="p-5 border-b border-gray-100">
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex-1">
                      <p className="font-mono text-xs text-gray-400 mb-0.5">{resultado.protocolo}</p>
                      <h3 className="font-sora font-semibold text-gray-800 text-lg leading-snug">{resultado.titulo}</h3>
                      <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                        <span className="text-xs text-gray-500">{categoriaLabel[resultado.categoria]}</span>
                        {resultado.bairro && <span className="text-xs text-gray-400">· {resultado.bairro}</span>}
                      </div>
                    </div>
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${cfg.color} shrink-0`}>
                      <cfg.icon size={12} /> {cfg.label}
                    </span>
                  </div>

                  {/* Barra de progresso */}
                  <div className="mt-4">
                    <div className="flex justify-between text-[10px] text-gray-400 mb-1.5">
                      <span>Aberta</span><span>Em Análise</span><span>Em Campo</span><span>Resolvida</span>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${cfg.prog}%` }}
                        transition={{ duration: 0.8, delay: 0.2 }}
                        className={`h-full rounded-full ${resultado.status === 'RESOLVIDA' ? 'bg-green-500' : resultado.status === 'ARQUIVADA' ? 'bg-gray-400' : 'bg-primary-500'}`}
                      />
                    </div>
                  </div>

                  <p className="text-xs text-gray-400 mt-3">
                    Registrada em {new Date(resultado.criadoEm).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}
                  </p>
                </div>

                {/* Fotos */}
                {resultado.fotos && resultado.fotos.length > 0 && (
                  <div className="p-5 border-b border-gray-100">
                    <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-3 flex items-center gap-1.5">
                      <Image size={13} /> Fotos ({resultado.fotos.length})
                    </h4>
                    <div className="flex gap-2 overflow-x-auto pb-1">
                      {resultado.fotos.map((f, i) => (
                        <a key={i} href={f.url} target="_blank" rel="noopener noreferrer" className="shrink-0">
                          <img src={f.url} alt={f.nomeArquivo} className="w-20 h-20 object-cover rounded-xl hover:opacity-90 transition-opacity" />
                        </a>
                      ))}
                    </div>
                  </div>
                )}

                {/* Histórico */}
                {resultado.historicos.length > 0 && (
                  <div className="p-5">
                    <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-4 flex items-center gap-1.5">
                      <Clock size={13} /> Histórico de atualizações
                    </h4>
                    <div className="relative">
                      <div className="absolute left-3 top-0 bottom-0 w-px bg-gray-100" />
                      <div className="space-y-4">
                        {[...resultado.historicos].reverse().map((h, i) => {
                          const hcfg = statusConfig[h.statusNovo] ?? statusConfig.ABERTA;
                          return (
                            <div key={i} className="flex gap-4 relative">
                              <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 z-10 bg-white ${hcfg.color}`}>
                                <hcfg.icon size={11} />
                              </div>
                              <div className="flex-1 pb-1">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${hcfg.color}`}>{hcfg.label}</span>
                                  <span className="text-xs text-gray-400">
                                    {new Date(h.criadoEm).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                                  </span>
                                </div>
                                {h.comentario && <p className="text-sm text-gray-600 mt-1.5 leading-relaxed">{h.comentario}</p>}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex gap-3">
                <Link to="/denuncia" className="flex-1 py-3 border border-gray-200 rounded-2xl text-sm font-medium text-center text-gray-600 hover:bg-gray-50 transition-colors">
                  Nova denúncia
                </Link>
                <Link to="/" className="flex-1 py-3 bg-primary-500 text-white rounded-2xl text-sm font-medium text-center hover:bg-primary-600 transition-colors">
                  Início
                </Link>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
