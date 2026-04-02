import { useEffect, useState, useCallback } from 'react';
import {
  ChevronLeft, ChevronRight, Users, RefreshCw, X,
  TrendingUp, TrendingDown, Clock, CheckCircle2, AlertCircle,
} from 'lucide-react';
import api from '../../services/api';
import { cn } from '../../utils/cn';

const MESES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
];

const papelLabel: Record<string, string> = {
  ADMIN_SISTEMA: 'Admin Sistema',
  SECRETARIO: 'Secretário',
  FISCAL: 'Fiscal',
  OPERADOR: 'Operador',
};

function formatHoras(h: number) {
  const abs = Math.abs(h);
  const hh = Math.floor(abs);
  const mm = Math.round((abs - hh) * 60);
  const sinal = h < 0 ? '-' : h > 0 ? '+' : '';
  return `${sinal}${String(hh).padStart(2, '0')}h ${String(mm).padStart(2, '0')}m`;
}

function formatHora(date: string) {
  return new Date(date).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}

interface UsuarioItem {
  id: string;
  nome: string;
  papel: string;
  ativo: boolean;
}

interface SaldoItem {
  saldoTotal: number;
}

interface RegistroHoje {
  usuarioId: string;
  tipo: string;
  criadoEm: string;
}

interface DiaDados {
  data: string;
  pontos: Array<{ tipo: string; hora?: string; criadoEm?: string }>;
  horasTrabalhadas: number;
  horasEsperadas: number;
  saldo: number;
  temAtestado: boolean;
}

interface EspelhoData {
  dias: DiaDados[];
  totais: {
    horasTrabalhadas: number;
    horasEsperadas: number;
    saldoTotal: number;
    horasExtras: number;
    faltas: number;
  };
}

interface EquipeRow {
  usuario: UsuarioItem;
  saldo: number | null;
  registrosHoje: RegistroHoje[];
}

export default function GestaoEquipe() {
  const [rows, setRows] = useState<EquipeRow[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [processando, setProcessando] = useState(false);
  const [sdrMsg, setSdrMsg] = useState<string | null>(null);

  // Modal espelho
  const [usuarioSelecionado, setUsuarioSelecionado] = useState<UsuarioItem | null>(null);
  const [espelho, setEspelho] = useState<EspelhoData | null>(null);
  const [carregandoEspelho, setCarregandoEspelho] = useState(false);

  const agora = new Date();
  const [ano, setAno] = useState(agora.getFullYear());
  const [mes, setMes] = useState(agora.getMonth() + 1);

  const carregar = useCallback(async () => {
    setCarregando(true);
    try {
      const [{ data: usuarios }, { data: hoje }] = await Promise.all([
        api.get<UsuarioItem[]>('/api/usuarios'),
        api.get<RegistroHoje[]>('/api/ponto/hoje'),
      ]);

      const saldos = await Promise.allSettled(
        usuarios.map((u) =>
          api.get<SaldoItem>(`/api/ponto/historico-saldo/${u.id}`)
        )
      );

      const built: EquipeRow[] = usuarios.map((u, i) => ({
        usuario: u,
        saldo:
          saldos[i].status === 'fulfilled'
            ? (saldos[i] as PromiseFulfilledResult<{ data: SaldoItem }>).value.data.saldoTotal
            : null,
        registrosHoje: hoje.filter((r) => r.usuarioId === u.id),
      }));

      setRows(built);
    } finally {
      setCarregando(false);
    }
  }, []);

  useEffect(() => {
    carregar();
  }, [carregar]);

  const carregarEspelho = useCallback(async (usuarioId: string, a: number, m: number) => {
    setCarregandoEspelho(true);
    setEspelho(null);
    try {
      const { data } = await api.get<EspelhoData>(
        `/api/ponto/espelho/${usuarioId}?ano=${a}&mes=${m}`
      );
      setEspelho(data);
    } catch {
      setEspelho(null);
    } finally {
      setCarregandoEspelho(false);
    }
  }, []);

  const abrirModal = (row: EquipeRow) => {
    setUsuarioSelecionado(row.usuario);
    setAno(agora.getFullYear());
    setMes(agora.getMonth() + 1);
    carregarEspelho(row.usuario.id, agora.getFullYear(), agora.getMonth() + 1);
  };

  const fecharModal = () => {
    setUsuarioSelecionado(null);
    setEspelho(null);
  };

  const navMes = (delta: number) => {
    let nm = mes + delta;
    let na = ano;
    if (nm > 12) { nm = 1; na++; }
    if (nm < 1) { nm = 12; na--; }
    setMes(nm);
    setAno(na);
    if (usuarioSelecionado) {
      carregarEspelho(usuarioSelecionado.id, na, nm);
    }
  };

  const processarSDR = async () => {
    setProcessando(true);
    setSdrMsg(null);
    try {
      await api.post('/api/ponto/processar-sdr');
      setSdrMsg('SDR processado com sucesso!');
      carregar();
    } catch {
      setSdrMsg('Erro ao processar SDR.');
    } finally {
      setProcessando(false);
    }
  };

  const statusHoje = (registros: RegistroHoje[]) => {
    if (registros.length === 0)
      return { label: 'Sem registro', color: 'bg-gray-100 text-gray-500' };
    const tipos = registros.map((r) => r.tipo);
    if (tipos.includes('SAIDA'))
      return { label: 'Saiu', color: 'bg-blue-100 text-blue-700' };
    if (tipos.includes('ALMOCO_VOLTA'))
      return { label: 'Voltou almoço', color: 'bg-green-100 text-green-700' };
    if (tipos.includes('ALMOCO_SAIDA'))
      return { label: 'Almoço', color: 'bg-yellow-100 text-yellow-700' };
    if (tipos.includes('ENTRADA'))
      return { label: 'Presente', color: 'bg-green-100 text-green-700' };
    return { label: 'Parcial', color: 'bg-orange-100 text-orange-700' };
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <Users size={16} />
          <span>{rows.length} funcionário(s)</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={carregar}
            disabled={carregando}
            className="btn-secondary flex items-center gap-2 text-sm"
          >
            <RefreshCw size={14} className={carregando ? 'animate-spin' : ''} />
            Atualizar
          </button>
          <button
            onClick={processarSDR}
            disabled={processando}
            className="btn-primary flex items-center gap-2 text-sm"
          >
            <Clock size={14} />
            {processando ? 'Processando...' : 'Processar SDR'}
          </button>
        </div>
      </div>

      {sdrMsg && (
        <div className={cn(
          'rounded-lg px-4 py-3 text-sm flex items-center gap-2',
          sdrMsg.includes('sucesso') ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600'
        )}>
          {sdrMsg.includes('sucesso')
            ? <CheckCircle2 size={16} />
            : <AlertCircle size={16} />}
          {sdrMsg}
          <button onClick={() => setSdrMsg(null)} className="ml-auto">
            <X size={14} />
          </button>
        </div>
      )}

      {/* Tabela */}
      <div className="card p-0 overflow-hidden">
        {carregando ? (
          <div className="flex items-center justify-center h-48">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
          </div>
        ) : rows.length === 0 ? (
          <div className="text-center py-16 text-gray-400 text-sm">Nenhum funcionário encontrado</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Nome</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Papel</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Saldo de Horas</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Status Hoje</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {rows.map((row) => {
                  const status = statusHoje(row.registrosHoje);
                  return (
                    <tr
                      key={row.usuario.id}
                      className="hover:bg-gray-50 cursor-pointer transition-colors"
                      onClick={() => abrirModal(row)}
                    >
                      <td className="px-4 py-3 font-medium text-gray-800">{row.usuario.nome}</td>
                      <td className="px-4 py-3 text-gray-500 text-xs">
                        {papelLabel[row.usuario.papel] ?? row.usuario.papel}
                      </td>
                      <td className="px-4 py-3">
                        {row.saldo === null ? (
                          <span className="text-gray-400 text-xs">—</span>
                        ) : (
                          <span className={cn(
                            'font-mono text-sm font-semibold flex items-center gap-1 w-fit',
                            row.saldo > 0 ? 'text-green-600' : row.saldo < 0 ? 'text-red-500' : 'text-gray-500'
                          )}>
                            {row.saldo > 0
                              ? <TrendingUp size={13} />
                              : row.saldo < 0
                                ? <TrendingDown size={13} />
                                : null}
                            {formatHoras(row.saldo)}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span className={cn('badge text-xs', status.color)}>
                          {status.label}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal Espelho */}
      {usuarioSelecionado && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
          onClick={(e) => { if (e.target === e.currentTarget) fecharModal(); }}
        >
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden">
            {/* Modal header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <div>
                <h3 className="font-sora font-bold text-gray-800">{usuarioSelecionado.nome}</h3>
                <p className="text-xs text-gray-400">{papelLabel[usuarioSelecionado.papel] ?? usuarioSelecionado.papel} · Espelho de Ponto</p>
              </div>
              <button
                onClick={fecharModal}
                className="p-2 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600"
              >
                <X size={18} />
              </button>
            </div>

            {/* Month nav */}
            <div className="flex items-center justify-between px-6 py-3 border-b border-gray-50">
              <button onClick={() => navMes(-1)} className="p-2 rounded-lg hover:bg-gray-100">
                <ChevronLeft size={16} />
              </button>
              <span className="font-sora font-semibold text-gray-700">
                {MESES[mes - 1]} {ano}
              </span>
              <button onClick={() => navMes(1)} className="p-2 rounded-lg hover:bg-gray-100">
                <ChevronRight size={16} />
              </button>
            </div>

            {/* Totais */}
            {espelho && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 px-6 py-3 border-b border-gray-50">
                <div className="bg-gray-50 rounded-lg p-3 text-center">
                  <p className="text-xs text-gray-400">Trabalhado</p>
                  <p className="font-mono font-bold text-gray-800 text-sm">{formatHoras(espelho.totais.horasTrabalhadas)}</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-3 text-center">
                  <p className="text-xs text-gray-400">Esperado</p>
                  <p className="font-mono font-bold text-gray-800 text-sm">{formatHoras(espelho.totais.horasEsperadas)}</p>
                </div>
                <div className="bg-green-50 rounded-lg p-3 text-center">
                  <p className="text-xs text-gray-400">H. Extras</p>
                  <p className="font-mono font-bold text-green-700 text-sm">+{formatHoras(espelho.totais.horasExtras)}</p>
                </div>
                <div className="bg-red-50 rounded-lg p-3 text-center">
                  <p className="text-xs text-gray-400">Faltas</p>
                  <p className="font-mono font-bold text-red-600 text-sm">-{formatHoras(espelho.totais.faltas)}</p>
                </div>
              </div>
            )}

            {/* Tabela de dias */}
            <div className="overflow-y-auto flex-1 px-6 py-4">
              {carregandoEspelho ? (
                <div className="flex justify-center py-12">
                  <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full" />
                </div>
              ) : espelho && espelho.dias.length > 0 ? (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-xs text-gray-400 border-b border-gray-100">
                      <th className="text-left pb-2 pr-3">Data</th>
                      <th className="text-center pb-2 px-2">Entrada</th>
                      <th className="text-center pb-2 px-2">S.Alm.</th>
                      <th className="text-center pb-2 px-2">V.Alm.</th>
                      <th className="text-center pb-2 px-2">Saída</th>
                      <th className="text-center pb-2 px-2">Total</th>
                      <th className="text-center pb-2 px-2">Saldo</th>
                    </tr>
                  </thead>
                  <tbody>
                    {espelho.dias.map((d) => {
                      const entrada = d.pontos.find((p) => p.tipo === 'ENTRADA');
                      const saidaAlm = d.pontos.find((p) => p.tipo === 'ALMOCO_SAIDA');
                      const voltaAlm = d.pontos.find((p) => p.tipo === 'ALMOCO_VOLTA');
                      const saida = d.pontos.find((p) => p.tipo === 'SAIDA');
                      const getHora = (p: DiaDados['pontos'][0] | undefined) => {
                        if (!p) return '—';
                        const ts = p.hora ?? p.criadoEm;
                        return ts ? formatHora(ts) : '—';
                      };
                      const isFalta = d.pontos.length === 0 && !d.temAtestado;
                      return (
                        <tr
                          key={d.data}
                          className={cn(
                            'border-b border-gray-50 hover:bg-gray-50',
                            isFalta ? 'bg-red-50/50' : d.temAtestado ? 'bg-blue-50/50' : ''
                          )}
                        >
                          <td className="py-2 pr-3 font-medium text-gray-700 text-xs">
                            {new Date(d.data).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
                            {d.temAtestado && <span className="ml-1 text-xs bg-blue-100 text-blue-600 px-1 rounded">Atst.</span>}
                            {isFalta && <span className="ml-1 text-xs bg-red-100 text-red-600 px-1 rounded">Falta</span>}
                          </td>
                          <td className="py-2 px-2 text-center font-mono text-xs text-gray-600">{getHora(entrada)}</td>
                          <td className="py-2 px-2 text-center font-mono text-xs text-gray-600">{getHora(saidaAlm)}</td>
                          <td className="py-2 px-2 text-center font-mono text-xs text-gray-600">{getHora(voltaAlm)}</td>
                          <td className="py-2 px-2 text-center font-mono text-xs text-gray-600">{getHora(saida)}</td>
                          <td className="py-2 px-2 text-center font-mono text-xs font-medium">{formatHoras(d.horasTrabalhadas)}</td>
                          <td className={cn(
                            'py-2 px-2 text-center font-mono text-xs font-bold',
                            d.saldo > 0 ? 'text-green-600' : d.saldo < 0 ? 'text-red-500' : 'text-gray-400'
                          )}>
                            {d.saldo > 0 ? '+' : ''}{formatHoras(d.saldo)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              ) : (
                <div className="text-center py-10 text-gray-400 text-sm">Nenhum registro neste período</div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
