import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  TrendingUp,
  TrendingDown,
  Minus,
  AlertTriangle,
  CheckCircle,
  Receipt,
  ClipboardCheck,
  Award,
  DollarSign,
} from 'lucide-react';
import api from '../services/api';

interface DesempenhoData {
  ocorrencias: {
    mesAtual: number;
    mesAnterior: number;
    variacaoPercent: number | null;
  };
  resolucoes: {
    mesAtual: number;
    mesAnterior: number;
    variacaoPercent: number | null;
  };
  multas: {
    mesAtual: number;
    pagas: number;
    taxaPagamento: number;
    totalArrecadado: number;
  };
  vistorias: {
    mesAtual: number;
    realizadas: number;
    taxaRealizacao: number;
  };
  topFiscais: {
    fiscalId: string;
    nome: string;
    resolucoes: number;
  }[];
}

function SkeletonCard() {
  return (
    <div className="bg-white rounded-xl border border-gray-100 p-5 animate-pulse space-y-3">
      <div className="h-4 bg-gray-200 rounded w-2/3" />
      <div className="h-8 bg-gray-200 rounded w-1/3" />
      <div className="h-3 bg-gray-100 rounded w-1/2" />
    </div>
  );
}

function VariacaoIndicador({
  percent,
  invertido = false,
}: {
  percent: number | null;
  invertido?: boolean;
}) {
  if (percent === null) {
    return (
      <span className="inline-flex items-center gap-1 text-xs text-gray-400">
        <Minus size={12} /> Sem comparativo
      </span>
    );
  }

  const positivo = invertido ? percent < 0 : percent > 0;
  const negativo = invertido ? percent > 0 : percent < 0;

  if (percent === 0) {
    return (
      <span className="inline-flex items-center gap-1 text-xs text-gray-400">
        <Minus size={12} /> Igual ao mês anterior
      </span>
    );
  }

  return (
    <span
      className={`inline-flex items-center gap-1 text-xs font-medium ${
        positivo ? 'text-green-600' : negativo ? 'text-red-500' : 'text-gray-400'
      }`}
    >
      {positivo ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
      {Math.abs(percent)}% vs mês anterior
    </span>
  );
}

function BarraProgresso({ valor, label }: { valor: number; label: string }) {
  return (
    <div className="space-y-1.5">
      <div className="flex justify-between text-sm">
        <span className="text-gray-500">{label}</span>
        <span className="font-bold text-gray-900">{valor}%</span>
      </div>
      <div className="w-full bg-gray-100 rounded-full h-2.5">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${valor}%` }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          className={`h-2.5 rounded-full ${
            valor >= 80
              ? 'bg-green-500'
              : valor >= 50
              ? 'bg-yellow-400'
              : 'bg-red-400'
          }`}
        />
      </div>
    </div>
  );
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}

export default function Desempenho() {
  const [dados, setDados] = useState<DesempenhoData | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState('');

  useEffect(() => {
    api
      .get('/api/dashboard/desempenho')
      .then(({ data }) => setDados(data))
      .catch(() => setErro('Erro ao carregar dados de desempenho.'))
      .finally(() => setCarregando(false));
  }, []);

  const maxResolucoes = dados?.topFiscais[0]?.resolucoes ?? 1;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <TrendingUp size={24} className="text-primary" />
          Desempenho
        </h1>
        <p className="text-sm text-gray-500 mt-0.5">Indicadores do mês atual</p>
      </div>

      {erro && (
        <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg px-4 py-3">
          {erro}
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        {carregando ? (
          <>
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </>
        ) : dados ? (
          <>
            {/* Card 1: Ocorrências */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0 }}
              className="bg-white rounded-xl border border-gray-100 p-5 space-y-2 shadow-sm"
            >
              <div className="flex items-center gap-2 text-orange-500">
                <AlertTriangle size={18} />
                <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                  Ocorrências este mês
                </span>
              </div>
              <p className="text-4xl font-bold text-gray-900">{dados.ocorrencias.mesAtual}</p>
              <VariacaoIndicador
                percent={dados.ocorrencias.variacaoPercent}
                invertido={true}
              />
            </motion.div>

            {/* Card 2: Resoluções */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.08 }}
              className="bg-white rounded-xl border border-gray-100 p-5 space-y-2 shadow-sm"
            >
              <div className="flex items-center gap-2 text-green-500">
                <CheckCircle size={18} />
                <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                  Resoluções este mês
                </span>
              </div>
              <p className="text-4xl font-bold text-gray-900">{dados.resolucoes.mesAtual}</p>
              <VariacaoIndicador
                percent={dados.resolucoes.variacaoPercent}
                invertido={false}
              />
            </motion.div>

            {/* Card 3: Taxa pagamento multas */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.16 }}
              className="bg-white rounded-xl border border-gray-100 p-5 space-y-3 shadow-sm"
            >
              <div className="flex items-center gap-2 text-blue-500">
                <Receipt size={18} />
                <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                  Pagamento de multas
                </span>
              </div>
              <p className="text-4xl font-bold text-gray-900">{dados.multas.taxaPagamento}%</p>
              <BarraProgresso valor={dados.multas.taxaPagamento} label={`${dados.multas.pagas}/${dados.multas.mesAtual} pagas`} />
            </motion.div>

            {/* Card 4: Taxa realização vistorias */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.24 }}
              className="bg-white rounded-xl border border-gray-100 p-5 space-y-3 shadow-sm"
            >
              <div className="flex items-center gap-2 text-purple-500">
                <ClipboardCheck size={18} />
                <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                  Realização de vistorias
                </span>
              </div>
              <p className="text-4xl font-bold text-gray-900">{dados.vistorias.taxaRealizacao}%</p>
              <BarraProgresso valor={dados.vistorias.taxaRealizacao} label={`${dados.vistorias.realizadas}/${dados.vistorias.mesAtual} realizadas`} />
            </motion.div>
          </>
        ) : null}
      </div>

      {/* Bottom row */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        {/* Top 5 Fiscais */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.32 }}
          className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm"
        >
          <div className="flex items-center gap-2 mb-4">
            <Award size={18} className="text-yellow-500" />
            <h2 className="font-semibold text-gray-900">Top 5 Fiscais</h2>
            <span className="text-xs text-gray-400 ml-1">por ocorrências resolvidas</span>
          </div>

          {carregando ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-8 bg-gray-100 rounded animate-pulse" />
              ))}
            </div>
          ) : dados && dados.topFiscais.length === 0 ? (
            <p className="text-sm text-gray-400 py-4 text-center">Nenhum dado disponível</p>
          ) : (
            <div className="space-y-3">
              {dados?.topFiscais.map((fiscal, idx) => (
                <div key={fiscal.fiscalId} className="flex items-center gap-3">
                  <span
                    className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                      idx === 0
                        ? 'bg-yellow-100 text-yellow-700'
                        : idx === 1
                        ? 'bg-gray-100 text-gray-600'
                        : idx === 2
                        ? 'bg-orange-100 text-orange-600'
                        : 'bg-gray-50 text-gray-400'
                    }`}
                  >
                    {idx + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between mb-1">
                      <span className="text-sm font-medium text-gray-800 truncate">{fiscal.nome}</span>
                      <span className="text-sm font-bold text-gray-900 ml-2 shrink-0">{fiscal.resolucoes}</span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-1.5">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${(fiscal.resolucoes / maxResolucoes) * 100}%` }}
                        transition={{ duration: 0.6, delay: idx * 0.1 }}
                        className="h-1.5 rounded-full bg-primary"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </motion.div>

        {/* Arrecadação total */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm"
        >
          <div className="flex items-center gap-2 mb-4">
            <DollarSign size={18} className="text-green-500" />
            <h2 className="font-semibold text-gray-900">Arrecadação Total</h2>
            <span className="text-xs text-gray-400 ml-1">multas (todos os períodos)</span>
          </div>

          {carregando ? (
            <div className="h-16 bg-gray-100 rounded animate-pulse" />
          ) : dados ? (
            <div className="flex flex-col justify-center h-24">
              <p className="text-4xl font-bold text-gray-900">
                {formatCurrency(dados.multas.totalArrecadado)}
              </p>
              <p className="text-sm text-gray-400 mt-2">
                {dados.multas.pagas} multa(s) pagas este mês
              </p>
            </div>
          ) : null}
        </motion.div>
      </div>
    </div>
  );
}
