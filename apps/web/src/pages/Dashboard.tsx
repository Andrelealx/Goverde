import { useEffect, useState, useRef } from 'react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from 'recharts';
import { motion } from 'framer-motion';
import {
  AlertTriangle, FileText, Calendar, TrendingUp,
  Clock, CheckCircle, Activity, Bell,
} from 'lucide-react';
import { MapContainer, TileLayer, CircleMarker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import api from '../services/api';
import { formatDate, categoriaLabel, statusOcorrenciaColor, statusOcorrenciaLabel } from '../utils/formatters';
import { cn } from '../utils/cn';

interface Resumo {
  totalOcorrencias: number;
  ocorrenciasAbertas: number;
  ocorrenciasResolvidas: number;
  totalLicencas: number;
  licencasVencendo: number;
  totalVistorias: number;
  vistoriasPendentes: number;
}

interface OcorrenciaPin {
  id: string;
  protocolo: string;
  titulo: string;
  status: string;
  categoria: string;
  latitude: number | null;
  longitude: number | null;
  bairro: string | null;
}

const CORES = ['#2D6A4F', '#40916C', '#52B962', '#F4A261', '#E63946', '#1B4F72', '#9DD7B8'];

const statusCorMapa: Record<string, string> = {
  ABERTA: '#E63946',
  EM_ANALISE: '#F4A261',
  EM_CAMPO: '#1B4F72',
  RESOLVIDA: '#40916C',
  ARQUIVADA: '#9CA3AF',
};

function HeatLayer({ pontos }: { pontos: [number, number, number][] }) {
  const map = useMap();

  useEffect(() => {
    if (!pontos.length) return;
    let layer: any;
    import('leaflet' as any).then(() => {
      // @ts-ignore
      const L = (window as any).L ?? require('leaflet');
      if ((L as any).heatLayer) {
        // @ts-ignore
        layer = (L as any).heatLayer(pontos, { radius: 35, blur: 25, maxZoom: 17, gradient: { 0.2: '#40916C', 0.5: '#F4A261', 1.0: '#E63946' } }).addTo(map);
      }
    });
    return () => { if (layer) map.removeLayer(layer); };
  }, [pontos, map]);

  return null;
}

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.1, duration: 0.4, ease: 'easeOut' } }),
};

export default function Dashboard() {
  const [resumo, setResumo] = useState<Resumo | null>(null);
  const [porMes, setPorMes] = useState<{ mes: string; total: number }[]>([]);
  const [porCategoria, setPorCategoria] = useState<{ categoria: string; total: number }[]>([]);
  const [ocorrenciasPins, setOcorrenciasPins] = useState<OcorrenciaPin[]>([]);
  const [mapaMode, setMapaMode] = useState<'pins' | 'calor'>('pins');
  const [carregando, setCarregando] = useState(true);
  const [notificacoes, setNotificacoes] = useState<{ tipo: string; mensagem: string }[]>([]);

  useEffect(() => {
    Promise.all([
      api.get('/api/dashboard/resumo'),
      api.get('/api/dashboard/ocorrencias-por-mes'),
      api.get('/api/dashboard/ocorrencias-por-categoria'),
      api.get('/api/ocorrencias?limite=100'),
      api.get('/api/notificacoes'),
    ]).then(([r, m, c, oc, n]) => {
      setResumo(r.data);
      setPorMes(m.data);
      setPorCategoria(c.data.map((d: any) => ({
        ...d,
        categoria: categoriaLabel[d.categoria] ?? d.categoria,
      })));
      setOcorrenciasPins(oc.data.data);
      setNotificacoes(n.data);
    }).finally(() => setCarregando(false));
  }, []);

  const pontosComCoordenada = ocorrenciasPins.filter((o) => o.latitude && o.longitude);
  const heatPoints: [number, number, number][] = pontosComCoordenada.map((o) => [o.latitude!, o.longitude!, 0.8]);

  const centroMapa: [number, number] = pontosComCoordenada.length
    ? [
        pontosComCoordenada.reduce((s, o) => s + o.latitude!, 0) / pontosComCoordenada.length,
        pontosComCoordenada.reduce((s, o) => s + o.longitude!, 0) / pontosComCoordenada.length,
      ]
    : [-22.55, -43.18]; // fallback Guapimirim

  if (carregando) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center gap-3">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary" />
          <p className="text-sm text-gray-400">Carregando dashboard...</p>
        </div>
      </div>
    );
  }

  const kpis = [
    {
      label: 'Ocorrências Abertas',
      value: resumo?.ocorrenciasAbertas ?? 0,
      sub: `de ${resumo?.totalOcorrencias ?? 0} total`,
      icon: AlertTriangle,
      gradient: 'from-orange-500 to-orange-400',
      bg: 'bg-orange-50',
      text: 'text-orange-600',
    },
    {
      label: 'Licenças Vencendo',
      value: resumo?.licencasVencendo ?? 0,
      sub: 'próximos 30 dias',
      icon: Clock,
      gradient: 'from-yellow-500 to-yellow-400',
      bg: 'bg-yellow-50',
      text: 'text-yellow-600',
    },
    {
      label: 'Vistorias Pendentes',
      value: resumo?.vistoriasPendentes ?? 0,
      sub: `de ${resumo?.totalVistorias ?? 0} agendadas`,
      icon: Calendar,
      gradient: 'from-blue-500 to-blue-400',
      bg: 'bg-blue-50',
      text: 'text-blue-600',
    },
    {
      label: 'Resolvidas',
      value: resumo?.ocorrenciasResolvidas ?? 0,
      sub: 'total acumulado',
      icon: CheckCircle,
      gradient: 'from-primary to-success',
      bg: 'bg-primary-50',
      text: 'text-primary',
    },
  ];

  const taxaResolucao = resumo?.totalOcorrencias
    ? Math.round((resumo.ocorrenciasResolvidas / resumo.totalOcorrencias) * 100)
    : 0;

  return (
    <div className="space-y-6">
      {/* Notificações */}
      {notificacoes.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-wrap gap-2"
        >
          {notificacoes.map((n, i) => (
            <div
              key={i}
              className={cn(
                'flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium',
                n.tipo === 'alerta' ? 'bg-red-100 text-red-700' :
                n.tipo === 'aviso' ? 'bg-yellow-100 text-yellow-700' :
                'bg-blue-100 text-blue-700'
              )}
            >
              <Bell size={12} />
              {n.mensagem}
            </div>
          ))}
        </motion.div>
      )}

      {/* KPIs */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        {kpis.map(({ label, value, sub, icon: Icon, gradient, bg, text }, i) => (
          <motion.div
            key={label}
            custom={i}
            variants={cardVariants}
            initial="hidden"
            animate="visible"
            className="bg-white rounded-card shadow-sm border border-gray-100 p-5 flex items-center gap-4 hover:shadow-md transition-shadow"
          >
            <div className={`w-12 h-12 rounded-xl ${bg} flex items-center justify-center shrink-0`}>
              <Icon size={22} className={text} />
            </div>
            <div className="min-w-0">
              <p className={`text-3xl font-sora font-bold ${text}`}>{value}</p>
              <p className="text-sm font-medium text-gray-600 truncate">{label}</p>
              <p className="text-xs text-gray-400">{sub}</p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Taxa de resolução */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="bg-gradient-to-r from-primary to-success rounded-card p-5 text-white"
      >
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Activity size={18} />
            <span className="font-sora font-semibold">Taxa de Resolução</span>
          </div>
          <span className="text-3xl font-sora font-bold">{taxaResolucao}%</span>
        </div>
        <div className="h-2 bg-white/30 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-white rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${taxaResolucao}%` }}
            transition={{ delay: 0.8, duration: 1, ease: 'easeOut' }}
          />
        </div>
        <div className="flex justify-between text-xs text-white/70 mt-1">
          <span>{resumo?.ocorrenciasResolvidas} resolvidas</span>
          <span>{resumo?.totalOcorrencias} total</span>
        </div>
      </motion.div>

      {/* Mapa */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="bg-white rounded-card border border-gray-100 shadow-sm overflow-hidden"
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h2 className="font-sora font-semibold text-gray-700">
            {mapaMode === 'calor' ? 'Mapa de Calor de Ocorrências' : 'Ocorrências no Mapa'}
          </h2>
          <div className="flex bg-gray-100 rounded-lg p-0.5">
            <button
              onClick={() => setMapaMode('pins')}
              className={cn(
                'px-3 py-1 rounded-md text-xs font-medium transition-all',
                mapaMode === 'pins' ? 'bg-white shadow text-primary' : 'text-gray-500'
              )}
            >
              Pins
            </button>
            <button
              onClick={() => setMapaMode('calor')}
              className={cn(
                'px-3 py-1 rounded-md text-xs font-medium transition-all',
                mapaMode === 'calor' ? 'bg-white shadow text-primary' : 'text-gray-500'
              )}
            >
              Calor
            </button>
          </div>
        </div>

        <div className="h-80">
          {pontosComCoordenada.length > 0 ? (
            <MapContainer
              center={centroMapa}
              zoom={12}
              style={{ height: '100%', width: '100%' }}
              scrollWheelZoom={false}
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org">OpenStreetMap</a>'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              {mapaMode === 'pins' && pontosComCoordenada.map((oc) => (
                <CircleMarker
                  key={oc.id}
                  center={[oc.latitude!, oc.longitude!]}
                  radius={8}
                  fillColor={statusCorMapa[oc.status] ?? '#6B7280'}
                  color="white"
                  weight={2}
                  fillOpacity={0.9}
                >
                  <Popup>
                    <div className="text-xs">
                      <p className="font-bold">{oc.protocolo}</p>
                      <p>{oc.titulo}</p>
                      <p className="text-gray-500">{statusOcorrenciaLabel[oc.status]}</p>
                    </div>
                  </Popup>
                </CircleMarker>
              ))}
              {mapaMode === 'calor' && <HeatLayer pontos={heatPoints} />}
            </MapContainer>
          ) : (
            <div className="h-full flex items-center justify-center flex-col gap-2 text-gray-400">
              <p className="text-sm">Nenhuma ocorrência com coordenadas cadastradas.</p>
              <p className="text-xs">Adicione latitude/longitude ao registrar ocorrências.</p>
            </div>
          )}
        </div>

        {/* Legenda de status */}
        {mapaMode === 'pins' && (
          <div className="px-5 py-3 border-t border-gray-100 flex flex-wrap gap-3">
            {Object.entries(statusCorMapa).map(([status, cor]) => (
              <div key={status} className="flex items-center gap-1.5 text-xs text-gray-500">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: cor }} />
                {statusOcorrenciaLabel[status]}
              </div>
            ))}
          </div>
        )}
      </motion.div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Área mensal */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.6 }}
          className="bg-white rounded-card border border-gray-100 shadow-sm p-5"
        >
          <h2 className="font-sora font-semibold text-gray-700 mb-4">Ocorrências por Mês</h2>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={porMes}>
              <defs>
                <linearGradient id="gradVerde" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#2D6A4F" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#2D6A4F" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="mes" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
              <Area
                type="monotone"
                dataKey="total"
                stroke="#2D6A4F"
                strokeWidth={2}
                fill="url(#gradVerde)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Pizza categorias */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.7 }}
          className="bg-white rounded-card border border-gray-100 shadow-sm p-5"
        >
          <h2 className="font-sora font-semibold text-gray-700 mb-4">Por Categoria</h2>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={porCategoria}
                dataKey="total"
                nameKey="categoria"
                cx="50%"
                cy="50%"
                outerRadius={75}
                innerRadius={35}
              >
                {porCategoria.map((_, index) => (
                  <Cell key={index} fill={CORES[index % CORES.length]} />
                ))}
              </Pie>
              <Legend iconSize={10} wrapperStyle={{ fontSize: 11 }} />
              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
            </PieChart>
          </ResponsiveContainer>
        </motion.div>
      </div>

      <p className="text-xs text-gray-400 text-right">Atualizado em {formatDate(new Date())}</p>
    </div>
  );
}
