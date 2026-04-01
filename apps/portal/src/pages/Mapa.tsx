import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import axios from 'axios';
import { MapPin, TreePine, Flame, Trash2, Droplets, Volume2, Bird, HelpCircle, Loader2 } from 'lucide-react';
import Header from '../components/Header';
import Footer from '../components/Footer';

const TENANT_SLUG = import.meta.env.VITE_TENANT_SLUG ?? 'guapimirim';
const API_URL = import.meta.env.VITE_API_URL ?? '';

const statusConfig: Record<string, { label: string; cor: string }> = {
  ABERTA:     { label: 'Aberta',     cor: 'bg-red-100 text-red-700' },
  EM_ANALISE: { label: 'Em Análise', cor: 'bg-yellow-100 text-yellow-700' },
  EM_CAMPO:   { label: 'Em Campo',   cor: 'bg-blue-100 text-blue-700' },
  RESOLVIDA:  { label: 'Resolvida',  cor: 'bg-green-100 text-green-700' },
  ARQUIVADA:  { label: 'Arquivada',  cor: 'bg-gray-100 text-gray-600' },
};

const categoriaConfig: Record<string, { label: string; icon: typeof MapPin; cor: string }> = {
  DESMATAMENTO:    { label: 'Desmatamento',    icon: TreePine,   cor: 'text-green-600' },
  QUEIMADA:        { label: 'Queimada',        icon: Flame,      cor: 'text-orange-500' },
  RESIDUOS_ILEGAIS:{ label: 'Resíduos',        icon: Trash2,     cor: 'text-yellow-600' },
  POLUICAO_HIDRICA:{ label: 'Pol. Hídrica',    icon: Droplets,   cor: 'text-blue-500' },
  POLUICAO_SONORA: { label: 'Pol. Sonora',     icon: Volume2,    cor: 'text-purple-500' },
  FAUNA:           { label: 'Fauna',           icon: Bird,       cor: 'text-teal-500' },
  OUTRO:           { label: 'Outro',           icon: HelpCircle, cor: 'text-gray-500' },
};

interface OcorrenciaPublica {
  protocolo: string; titulo: string; categoria: string;
  status: string; bairro: string | null; criadoEm: string;
}

export default function Mapa() {
  const [ocorrencias, setOcorrencias] = useState<OcorrenciaPublica[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [filtroStatus, setFiltroStatus] = useState('');
  const [filtroCategoria, setFiltroCategoria] = useState('');

  useEffect(() => {
    axios.get(`${API_URL}/api/public/${TENANT_SLUG}/ocorrencias`)
      .then(({ data }) => setOcorrencias(data.data ?? data))
      .catch(() => {})
      .finally(() => setCarregando(false));
  }, []);

  const filtradas = ocorrencias.filter((o) => {
    if (filtroStatus && o.status !== filtroStatus) return false;
    if (filtroCategoria && o.categoria !== filtroCategoria) return false;
    return true;
  });

  const contadores = Object.keys(statusConfig).reduce((acc, s) => {
    acc[s] = ocorrencias.filter((o) => o.status === s).length;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <Header />

      {/* Hero compacto */}
      <div className="bg-gradient-to-r from-primary-600 to-primary-500 text-white py-10 px-4">
        <div className="max-w-5xl mx-auto">
          <h1 className="font-sora font-bold text-2xl md:text-3xl mb-1">Mapa de Ocorrências</h1>
          <p className="text-primary-100 text-sm">Transparência sobre as denúncias ambientais do município</p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto w-full px-4 py-8 space-y-6">
        {/* KPIs */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: 'Abertas', valor: contadores.ABERTA ?? 0, cor: 'text-red-600 bg-red-50 border-red-100' },
            { label: 'Em Análise', valor: contadores.EM_ANALISE ?? 0, cor: 'text-yellow-600 bg-yellow-50 border-yellow-100' },
            { label: 'Em Campo', valor: contadores.EM_CAMPO ?? 0, cor: 'text-blue-600 bg-blue-50 border-blue-100' },
            { label: 'Resolvidas', valor: contadores.RESOLVIDA ?? 0, cor: 'text-green-600 bg-green-50 border-green-100' },
          ].map((k) => (
            <div key={k.label} className={`rounded-2xl border p-4 text-center ${k.cor}`}>
              <p className="text-2xl font-bold font-sora">{k.valor}</p>
              <p className="text-xs font-medium mt-0.5 opacity-80">{k.label}</p>
            </div>
          ))}
        </div>

        {/* Distribuição por categoria */}
        <div className="bg-gray-50 rounded-2xl p-5">
          <h3 className="font-semibold text-gray-700 text-sm mb-4">Por categoria</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {Object.entries(categoriaConfig).map(([cat, { label, icon: Icon, cor }]) => {
              const qtd = ocorrencias.filter((o) => o.categoria === cat).length;
              return (
                <button
                  key={cat}
                  onClick={() => setFiltroCategoria(filtroCategoria === cat ? '' : cat)}
                  className={`flex items-center gap-2 p-3 rounded-xl border bg-white transition-all text-left ${filtroCategoria === cat ? 'border-primary-400 bg-primary-50' : 'border-gray-100 hover:border-primary-200'}`}
                >
                  <Icon size={16} className={cor} />
                  <div>
                    <p className="text-xs font-medium text-gray-700">{label}</p>
                    <p className="text-xs text-gray-400">{qtd} caso{qtd !== 1 ? 's' : ''}</p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Filtro status */}
        <div className="flex gap-2 flex-wrap">
          <button onClick={() => setFiltroStatus('')} className={`px-4 py-1.5 rounded-full text-xs font-medium border transition-all ${!filtroStatus ? 'bg-gray-900 text-white border-gray-900' : 'border-gray-200 text-gray-600 hover:border-gray-400'}`}>
            Todos ({ocorrencias.length})
          </button>
          {Object.entries(statusConfig).map(([s, { label }]) => (
            <button key={s} onClick={() => setFiltroStatus(filtroStatus === s ? '' : s)}
              className={`px-4 py-1.5 rounded-full text-xs font-medium border transition-all ${filtroStatus === s ? 'bg-gray-900 text-white border-gray-900' : 'border-gray-200 text-gray-600 hover:border-gray-400'}`}>
              {label} ({contadores[s] ?? 0})
            </button>
          ))}
        </div>

        {/* Lista */}
        {carregando ? (
          <div className="flex justify-center py-16">
            <Loader2 size={32} className="animate-spin text-primary-400" />
          </div>
        ) : filtradas.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <MapPin size={36} className="mx-auto mb-3 opacity-40" />
            <p className="text-sm">Nenhuma ocorrência encontrada com esses filtros.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtradas.map((o, i) => {
              const catCfg = categoriaConfig[o.categoria] ?? categoriaConfig.OUTRO;
              const stCfg = statusConfig[o.status] ?? statusConfig.ABERTA;
              const CatIcon = catCfg.icon;
              return (
                <motion.div
                  key={o.protocolo}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04 }}
                  className="bg-white rounded-2xl border border-gray-100 p-4 flex items-center gap-4 hover:shadow-md transition-shadow"
                >
                  <div className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center shrink-0">
                    <CatIcon size={20} className={catCfg.cor} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono text-xs text-gray-400">{o.protocolo}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${stCfg.cor}`}>{stCfg.label}</span>
                    </div>
                    <p className="text-sm font-medium text-gray-800 mt-0.5 truncate">{o.titulo}</p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {catCfg.label}{o.bairro ? ` · ${o.bairro}` : ''} · {new Date(o.criadoEm).toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}

        {filtradas.length > 0 && (
          <p className="text-center text-xs text-gray-400">
            Mostrando {filtradas.length} de {ocorrencias.length} ocorrência{ocorrencias.length !== 1 ? 's' : ''}
          </p>
        )}
      </div>

      <Footer />
    </div>
  );
}
