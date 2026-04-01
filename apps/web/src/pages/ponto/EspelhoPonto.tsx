import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, TrendingUp, TrendingDown, Download } from 'lucide-react';
import api from '../../services/api';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const MESES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
];

function formatHoras(h: number) {
  const abs = Math.abs(h);
  const hh = Math.floor(abs);
  const mm = Math.round((abs - hh) * 60);
  const sinal = h < 0 ? '-' : '';
  return `${sinal}${String(hh).padStart(2, '0')}h${String(mm).padStart(2, '0')}m`;
}

function formatHora(date: string) {
  return new Date(date).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}

interface DiaDados {
  data: string;
  pontos: Array<{ tipo: string; criadoEm: string }>;
  horasTrabalhadas: number;
  horasEsperadas: number;
  saldo: number;
  temAtestado: boolean;
}

interface Espelho {
  usuario: { nome: string; email: string; jornadaHoras: number };
  ano: number;
  mes: number;
  dias: DiaDados[];
  totais: {
    horasTrabalhadas: number;
    horasEsperadas: number;
    saldo: number;
    horasExtras: number;
    faltas: number;
  };
}

export default function EspelhoPonto() {
  const agora = new Date();
  const [ano, setAno] = useState(agora.getFullYear());
  const [mes, setMes] = useState(agora.getMonth() + 1);
  const [espelho, setEspelho] = useState<Espelho | null>(null);
  const [carregando, setCarregando] = useState(false);
  const [saldo, setSaldo] = useState<{ saldoTotal: number } | null>(null);

  useEffect(() => {
    carregarEspelho();
    carregarSaldo();
  }, [ano, mes]);

  const carregarEspelho = async () => {
    setCarregando(true);
    try {
      const { data } = await api.get(`/api/ponto/espelho?ano=${ano}&mes=${mes}`);
      setEspelho(data);
    } catch {} finally {
      setCarregando(false);
    }
  };

  const carregarSaldo = async () => {
    try {
      const { data } = await api.get('/api/ponto/saldo');
      setSaldo(data);
    } catch {}
  };

  const navMes = (delta: number) => {
    let nm = mes + delta;
    let na = ano;
    if (nm > 12) { nm = 1; na++; }
    if (nm < 1) { nm = 12; na--; }
    setMes(nm);
    setAno(na);
  };

  const exportarPDF = () => {
    if (!espelho) return;
    const doc = new jsPDF({ orientation: 'landscape' });
    doc.setFontSize(16);
    doc.text(`Espelho de Ponto — ${espelho.usuario.nome}`, 14, 18);
    doc.setFontSize(11);
    doc.text(`${MESES[mes - 1]}/${ano} | Jornada: ${espelho.usuario.jornadaHoras}h/dia`, 14, 26);

    const rows = espelho.dias.map((d) => {
      const entrada = d.pontos.find((p) => p.tipo === 'ENTRADA');
      const saidaAlmoco = d.pontos.find((p) => p.tipo === 'ALMOCO_SAIDA');
      const voltaAlmoco = d.pontos.find((p) => p.tipo === 'ALMOCO_VOLTA');
      const saida = d.pontos.find((p) => p.tipo === 'SAIDA');
      return [
        new Date(d.data).toLocaleDateString('pt-BR'),
        entrada ? formatHora(entrada.criadoEm) : '-',
        saidaAlmoco ? formatHora(saidaAlmoco.criadoEm) : '-',
        voltaAlmoco ? formatHora(voltaAlmoco.criadoEm) : '-',
        saida ? formatHora(saida.criadoEm) : '-',
        formatHoras(d.horasTrabalhadas),
        d.temAtestado ? 'Atestado' : d.pontos.length === 0 ? 'Falta' : 'OK',
        d.saldo > 0 ? `+${formatHoras(d.saldo)}` : formatHoras(d.saldo),
      ];
    });

    autoTable(doc, {
      head: [['Data', 'Entrada', 'Saída Alm.', 'Volta Alm.', 'Saída', 'Total', 'Situação', 'Saldo']],
      body: rows,
      startY: 32,
      styles: { fontSize: 9 },
      headStyles: { fillColor: [34, 197, 94] },
      didParseCell: (data) => {
        if (data.column.index === 7 && data.section === 'body') {
          const val = data.cell.raw as string;
          data.cell.styles.textColor = val.startsWith('+') ? [22, 163, 74] : val.startsWith('-') ? [220, 38, 38] : [100, 100, 100];
        }
      },
    });

    const finalY = (doc as any).lastAutoTable.finalY + 8;
    doc.setFontSize(10);
    doc.text(`Total trabalhado: ${formatHoras(espelho.totais.horasTrabalhadas)}`, 14, finalY);
    doc.text(`Horas extras: +${formatHoras(espelho.totais.horasExtras)}`, 80, finalY);
    doc.text(`Faltas: -${formatHoras(espelho.totais.faltas)}`, 160, finalY);
    doc.text(`Saldo do mês: ${espelho.totais.saldo >= 0 ? '+' : ''}${formatHoras(espelho.totais.saldo)}`, 220, finalY);

    doc.save(`espelho-ponto-${espelho.usuario.nome.replace(/\s/g, '_')}-${ano}-${String(mes).padStart(2, '0')}.pdf`);
  };

  return (
    <div className="space-y-4">
      {/* Saldo total */}
      {saldo !== null && (
        <div className={`rounded-xl p-4 flex items-center gap-4 ${saldo.saldoTotal >= 0 ? 'bg-green-50' : 'bg-red-50'}`}>
          {saldo.saldoTotal >= 0
            ? <TrendingUp size={28} className="text-green-600" />
            : <TrendingDown size={28} className="text-red-500" />
          }
          <div>
            <p className="text-xs text-gray-500">Saldo acumulado (Banco de Horas)</p>
            <p className={`text-2xl font-bold font-mono ${saldo.saldoTotal >= 0 ? 'text-green-700' : 'text-red-600'}`}>
              {saldo.saldoTotal >= 0 ? '+' : ''}{formatHoras(saldo.saldoTotal)}
            </p>
          </div>
        </div>
      )}

      {/* Navegação de mês */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <button onClick={() => navMes(-1)} className="p-2 rounded-lg hover:bg-gray-100">
            <ChevronLeft size={18} />
          </button>
          <div className="text-center">
            <h3 className="font-sora font-semibold text-gray-800">{MESES[mes - 1]} {ano}</h3>
            <p className="text-xs text-gray-400">Espelho de Ponto</p>
          </div>
          <button onClick={() => navMes(1)} className="p-2 rounded-lg hover:bg-gray-100">
            <ChevronRight size={18} />
          </button>
        </div>

        {/* Totais do mês */}
        {espelho && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
            <div className="bg-gray-50 rounded-lg p-3 text-center">
              <p className="text-xs text-gray-400">Trabalhado</p>
              <p className="font-mono font-bold text-gray-800">{formatHoras(espelho.totais.horasTrabalhadas)}</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-3 text-center">
              <p className="text-xs text-gray-400">Esperado</p>
              <p className="font-mono font-bold text-gray-800">{formatHoras(espelho.totais.horasEsperadas)}</p>
            </div>
            <div className="bg-green-50 rounded-lg p-3 text-center">
              <p className="text-xs text-gray-400">Horas Extras</p>
              <p className="font-mono font-bold text-green-700">+{formatHoras(espelho.totais.horasExtras)}</p>
            </div>
            <div className="bg-red-50 rounded-lg p-3 text-center">
              <p className="text-xs text-gray-400">Faltas</p>
              <p className="font-mono font-bold text-red-600">-{formatHoras(espelho.totais.faltas)}</p>
            </div>
          </div>
        )}

        {/* Botão exportar */}
        {espelho && (
          <button onClick={exportarPDF} className="btn-secondary w-full flex items-center justify-center gap-2 mb-4 text-sm">
            <Download size={15} />
            Exportar PDF
          </button>
        )}

        {/* Tabela de dias */}
        {carregando ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full" />
          </div>
        ) : espelho ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-xs text-gray-400 border-b border-gray-100">
                  <th className="text-left pb-2 pr-3">Data</th>
                  <th className="text-center pb-2 px-2">Entrada</th>
                  <th className="text-center pb-2 px-2">S. Alm.</th>
                  <th className="text-center pb-2 px-2">V. Alm.</th>
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
                  const isFalta = d.pontos.length === 0 && !d.temAtestado;
                  return (
                    <tr
                      key={d.data}
                      className={`border-b border-gray-50 hover:bg-gray-50 ${isFalta ? 'bg-red-50/50' : d.temAtestado ? 'bg-blue-50/50' : ''}`}
                    >
                      <td className="py-2 pr-3 font-medium text-gray-700">
                        {new Date(d.data).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
                        {d.temAtestado && <span className="ml-1 text-xs bg-blue-100 text-blue-600 px-1 rounded">Atst.</span>}
                        {isFalta && <span className="ml-1 text-xs bg-red-100 text-red-600 px-1 rounded">Falta</span>}
                      </td>
                      <td className="py-2 px-2 text-center font-mono text-xs text-gray-600">{entrada ? formatHora(entrada.criadoEm) : '—'}</td>
                      <td className="py-2 px-2 text-center font-mono text-xs text-gray-600">{saidaAlm ? formatHora(saidaAlm.criadoEm) : '—'}</td>
                      <td className="py-2 px-2 text-center font-mono text-xs text-gray-600">{voltaAlm ? formatHora(voltaAlm.criadoEm) : '—'}</td>
                      <td className="py-2 px-2 text-center font-mono text-xs text-gray-600">{saida ? formatHora(saida.criadoEm) : '—'}</td>
                      <td className="py-2 px-2 text-center font-mono text-xs font-medium">{formatHoras(d.horasTrabalhadas)}</td>
                      <td className={`py-2 px-2 text-center font-mono text-xs font-bold ${d.saldo > 0 ? 'text-green-600' : d.saldo < 0 ? 'text-red-500' : 'text-gray-400'}`}>
                        {d.saldo > 0 ? '+' : ''}{formatHoras(d.saldo)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : null}
      </div>
    </div>
  );
}
