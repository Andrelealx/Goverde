import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, AlertCircle } from 'lucide-react';
import api from '../services/api';
import {
  statusLicencaLabel,
  statusLicencaColor,
  formatDate,
} from '../utils/formatters';
import { cn } from '../utils/cn';
import { differenceInDays } from 'date-fns';

interface Licenca {
  id: string;
  protocolo: string;
  tipo: string;
  requerente: string;
  atividade: string;
  status: string;
  dataValidade: string | null;
  fiscalResponsavel: { nome: string } | null;
  criadoEm: string;
}

const tipoLabel: Record<string, string> = {
  INSTALACAO: 'Instalação',
  OPERACAO: 'Operação',
  LOCALIZACAO: 'Localização',
  SIMPLIFICADA: 'Simplificada',
};

export default function Licencas() {
  const [licencas, setLicencas] = useState<Licenca[]>([]);
  const [total, setTotal] = useState(0);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    api.get('/api/licencas?limite=50').then(({ data }) => {
      setLicencas(data.data);
      setTotal(data.total);
    }).finally(() => setCarregando(false));
  }, []);

  const diasParaVencer = (dataValidade: string | null) => {
    if (!dataValidade) return null;
    return differenceInDays(new Date(dataValidade), new Date());
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">{total} licença(s)</p>
        <Link to="/licencas/nova" className="btn-primary flex items-center gap-2">
          <Plus size={16} />
          Nova Licença
        </Link>
      </div>

      <div className="card p-0 overflow-hidden">
        {carregando ? (
          <div className="flex items-center justify-center h-48">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Protocolo</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Requerente</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Tipo</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Validade</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Fiscal</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {licencas.map((lic) => {
                  const dias = diasParaVencer(lic.dataValidade);
                  const vencendoEmBreve = dias !== null && dias <= 30 && dias >= 0;

                  return (
                    <tr key={lic.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3">
                        <Link to={`/licencas/${lic.id}`} className="font-mono text-primary hover:underline text-xs">
                          {lic.protocolo}
                        </Link>
                      </td>
                      <td className="px-4 py-3">
                        <Link to={`/licencas/${lic.id}`} className="hover:text-primary font-medium">
                          {lic.requerente}
                        </Link>
                        <p className="text-xs text-gray-400">{lic.atividade}</p>
                      </td>
                      <td className="px-4 py-3 text-gray-500">{tipoLabel[lic.tipo] ?? lic.tipo}</td>
                      <td className="px-4 py-3">
                        <span className={cn('badge', statusLicencaColor[lic.status])}>
                          {statusLicencaLabel[lic.status]}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {lic.dataValidade ? (
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs">{formatDate(lic.dataValidade)}</span>
                            {vencendoEmBreve && (
                              <AlertCircle size={14} className="text-warning" title={`Vence em ${dias} dias`} />
                            )}
                            {dias !== null && dias < 0 && (
                              <AlertCircle size={14} className="text-danger" title="Vencida" />
                            )}
                          </div>
                        ) : (
                          <span className="text-gray-400 text-xs">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-gray-500 text-xs">
                        {lic.fiscalResponsavel?.nome ?? '—'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
