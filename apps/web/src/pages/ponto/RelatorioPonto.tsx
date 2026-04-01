import { useEffect, useState } from 'react';
import { Download, User, MapPin, Fingerprint } from 'lucide-react';
import api from '../../services/api';
import { formatDateTime } from '../../utils/formatters';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface PontoItem {
  id: string;
  tipo: string;
  latitude: number;
  longitude: number;
  verificacaoFacial: boolean;
  similaridade: number | null;
  criadoEm: string;
  usuario: { nome: string; papel: string };
}

interface Usuario {
  id: string;
  nome: string;
  papel: string;
}

const tipoLabel: Record<string, string> = {
  ENTRADA: 'Entrada',
  ALMOCO_SAIDA: 'Saída Almoço',
  ALMOCO_VOLTA: 'Volta Almoço',
  SAIDA: 'Saída',
};

export default function RelatorioPonto() {
  const [pontos, setPontos] = useState<PontoItem[]>([]);
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [filtros, setFiltros] = useState({
    dataInicio: new Date(Date.now() - 7 * 86400000).toISOString().slice(0, 10),
    dataFim: new Date().toISOString().slice(0, 10),
    usuarioId: '',
  });
  const [carregando, setCarregando] = useState(false);

  useEffect(() => {
    api.get('/api/usuarios').then(({ data }) => setUsuarios(data));
    buscar();
  }, []);

  const buscar = async () => {
    setCarregando(true);
    try {
      const params = new URLSearchParams({
        dataInicio: filtros.dataInicio,
        dataFim: filtros.dataFim,
        ...(filtros.usuarioId && { usuarioId: filtros.usuarioId }),
      });
      const { data } = await api.get(`/api/ponto/relatorio?${params}`);
      setPontos(data);
    } finally {
      setCarregando(false);
    }
  };

  const exportarPDF = () => {
    const doc = new jsPDF();
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.text('Relatório de Ponto', 14, 20);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.text(`Período: ${filtros.dataInicio} a ${filtros.dataFim}`, 14, 28);
    doc.text(`Gerado em: ${new Date().toLocaleDateString('pt-BR')}`, 14, 34);

    autoTable(doc, {
      startY: 40,
      head: [['Funcionário', 'Tipo', 'Data/Hora', 'Face ID', 'Localização']],
      body: pontos.map((p) => [
        p.usuario.nome,
        tipoLabel[p.tipo] ?? p.tipo,
        formatDateTime(p.criadoEm),
        p.verificacaoFacial ? `${Math.round((p.similaridade ?? 0) * 100)}%` : 'Não',
        `${p.latitude.toFixed(5)}, ${p.longitude.toFixed(5)}`,
      ]),
      styles: { fontSize: 8 },
      headStyles: { fillColor: [45, 106, 79] },
    });

    doc.save(`ponto-${filtros.dataInicio}-${filtros.dataFim}.pdf`);
  };

  // Calcular totais por usuário
  const porUsuario = pontos.reduce((acc, p) => {
    const key = p.usuario.nome;
    if (!acc[key]) acc[key] = { nome: key, total: 0, comFace: 0 };
    acc[key].total++;
    if (p.verificacaoFacial) acc[key].comFace++;
    return acc;
  }, {} as Record<string, { nome: string; total: number; comFace: number }>);

  return (
    <div className="space-y-6">
      {/* Filtros */}
      <div className="card">
        <h3 className="font-sora font-semibold text-gray-700 mb-4">Filtros</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <label className="label">Data início</label>
            <input
              type="date"
              className="input"
              value={filtros.dataInicio}
              onChange={(e) => setFiltros({ ...filtros, dataInicio: e.target.value })}
            />
          </div>
          <div>
            <label className="label">Data fim</label>
            <input
              type="date"
              className="input"
              value={filtros.dataFim}
              onChange={(e) => setFiltros({ ...filtros, dataFim: e.target.value })}
            />
          </div>
          <div>
            <label className="label">Funcionário</label>
            <select className="input" value={filtros.usuarioId} onChange={(e) => setFiltros({ ...filtros, usuarioId: e.target.value })}>
              <option value="">Todos</option>
              {usuarios.map((u) => <option key={u.id} value={u.id}>{u.nome}</option>)}
            </select>
          </div>
          <div className="flex items-end gap-2">
            <button onClick={buscar} className="btn-primary flex-1">Buscar</button>
            <button onClick={exportarPDF} disabled={pontos.length === 0} className="btn-secondary p-2" title="Exportar PDF">
              <Download size={18} />
            </button>
          </div>
        </div>
      </div>

      {/* Resumo por usuário */}
      {Object.values(porUsuario).length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {Object.values(porUsuario).map((u) => (
            <div key={u.nome} className="card p-4">
              <div className="flex items-center gap-2 mb-2">
                <User size={14} className="text-gray-400" />
                <p className="text-sm font-medium truncate">{u.nome}</p>
              </div>
              <p className="text-2xl font-bold text-primary">{u.total}</p>
              <p className="text-xs text-gray-400">registros · {u.comFace} c/ face</p>
            </div>
          ))}
        </div>
      )}

      {/* Tabela */}
      <div className="card p-0 overflow-hidden">
        {carregando ? (
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
          </div>
        ) : pontos.length === 0 ? (
          <p className="text-center py-12 text-sm text-gray-400">Nenhum registro no período.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Funcionário</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Tipo</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Data/Hora</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Face ID</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Localização</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {pontos.map((p) => (
                  <tr key={p.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium">{p.usuario.nome}</td>
                    <td className="px-4 py-3 text-gray-500">{tipoLabel[p.tipo] ?? p.tipo}</td>
                    <td className="px-4 py-3 text-xs">{formatDateTime(p.criadoEm)}</td>
                    <td className="px-4 py-3">
                      {p.verificacaoFacial ? (
                        <span className="flex items-center gap-1 text-xs text-success">
                          <Fingerprint size={12} />
                          {p.similaridade ? `${Math.round(p.similaridade * 100)}%` : 'OK'}
                        </span>
                      ) : (
                        <span className="text-xs text-gray-400">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-400 flex items-center gap-1">
                      <MapPin size={10} />
                      {p.latitude.toFixed(4)}, {p.longitude.toFixed(4)}
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
