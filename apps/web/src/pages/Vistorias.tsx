import { useEffect, useState } from 'react';
import { formatDateTime } from '../utils/formatters';
import { cn } from '../utils/cn';
import api from '../services/api';

interface Vistoria {
  id: string;
  dataAgendada: string;
  dataRealizada: string | null;
  status: string;
  observacoes: string | null;
  fiscal: { nome: string };
  licenca: { protocolo: string; requerente: string } | null;
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

export default function Vistorias() {
  const [vistorias, setVistorias] = useState<Vistoria[]>([]);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    api.get('/api/vistorias').then(({ data }) => setVistorias(data)).finally(() => setCarregando(false));
  }, []);

  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-500">{vistorias.length} vistoria(s)</p>

      <div className="card p-0 overflow-hidden">
        {carregando ? (
          <div className="flex items-center justify-center h-48">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
          </div>
        ) : vistorias.length === 0 ? (
          <div className="text-center py-16 text-gray-400 text-sm">Nenhuma vistoria encontrada</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Agendado para</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Fiscal</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Licença</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Observações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {vistorias.map((v) => (
                  <tr key={v.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-xs">{formatDateTime(v.dataAgendada)}</td>
                    <td className="px-4 py-3">{v.fiscal.nome}</td>
                    <td className="px-4 py-3 text-xs text-gray-500">
                      {v.licenca ? (
                        <>
                          <span className="font-mono text-primary">{v.licenca.protocolo}</span>
                          <span className="ml-1">· {v.licenca.requerente}</span>
                        </>
                      ) : '—'}
                    </td>
                    <td className="px-4 py-3">
                      <span className={cn('badge', statusColor[v.status])}>
                        {statusLabel[v.status]}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-400 text-xs">{v.observacoes ?? '—'}</td>
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
