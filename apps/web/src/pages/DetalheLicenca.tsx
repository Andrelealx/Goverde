import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { AlertCircle, ArrowLeft } from 'lucide-react';
import api from '../services/api';
import {
  formatDate,
  formatDateTime,
  statusLicencaColor,
  statusLicencaLabel,
} from '../utils/formatters';
import { cn } from '../utils/cn';

interface Vistoria {
  id: string;
  dataAgendada: string;
  status: string;
  fiscal: { nome: string } | null;
}

interface Licenca {
  id: string;
  protocolo: string;
  tipo: string;
  requerente: string;
  cpfCnpj: string;
  atividade: string;
  endereco: string;
  municipio: string | null;
  status: string;
  dataValidade: string | null;
  criadoEm: string;
  atualizadoEm: string;
  fiscalResponsavel: { nome: string } | null;
  vistorias: Vistoria[];
}

const tipoLabel: Record<string, string> = {
  INSTALACAO: 'Instalação',
  OPERACAO: 'Operação',
  LOCALIZACAO: 'Localização',
  SIMPLIFICADA: 'Simplificada',
};

export default function DetalheLicenca() {
  const { id } = useParams();
  const [licenca, setLicenca] = useState<Licenca | null>(null);
  const [erro, setErro] = useState('');
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    if (!id) {
      setErro('Licença inválida.');
      setCarregando(false);
      return;
    }

    api.get(`/api/licencas/${id}`)
      .then(({ data }) => setLicenca(data))
      .catch((err: any) => setErro(err?.response?.data?.message ?? 'Não foi possível carregar a licença.'))
      .finally(() => setCarregando(false));
  }, [id]);

  const diasParaVencer = useMemo(() => {
    if (!licenca?.dataValidade) return null;
    const diff = new Date(licenca.dataValidade).getTime() - Date.now();
    return Math.ceil(diff / 86400000);
  }, [licenca?.dataValidade]);

  if (carregando) {
    return (
      <div className="card flex items-center justify-center h-56">
        <div className="animate-spin rounded-full h-7 w-7 border-b-2 border-primary" />
      </div>
    );
  }

  if (erro || !licenca) {
    return (
      <div className="max-w-3xl space-y-4">
        <Link to="/licencas" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700">
          <ArrowLeft size={15} />
          Voltar para licenças
        </Link>
        <div className="card border-red-200 bg-red-50 text-red-700">
          <p className="font-medium">Falha ao abrir licença</p>
          <p className="text-sm mt-1">{erro || 'Registro não encontrado.'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl space-y-4">
      <Link to="/licencas" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700">
        <ArrowLeft size={15} />
        Voltar para licenças
      </Link>

      <div className="card">
        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <div>
            <p className="font-mono text-xs text-gray-400 mb-1">{licenca.protocolo}</p>
            <h2 className="font-sora font-semibold text-xl text-gray-800">{licenca.requerente}</h2>
            <p className="text-sm text-gray-500 mt-1">{tipoLabel[licenca.tipo] ?? licenca.tipo}</p>
          </div>

          <span className={cn('badge', statusLicencaColor[licenca.status] ?? 'bg-gray-100 text-gray-600')}>
            {statusLicencaLabel[licenca.status] ?? licenca.status}
          </span>
        </div>

        {licenca.dataValidade && (
          <div className="mt-4 rounded-lg border border-gray-100 bg-gray-50 px-4 py-3">
            <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Validade</p>
            <p className="text-sm font-medium text-gray-700">{formatDate(licenca.dataValidade)}</p>
            {diasParaVencer !== null && (
              <p className={cn(
                'text-xs mt-1',
                diasParaVencer < 0 ? 'text-danger' : diasParaVencer <= 30 ? 'text-warning' : 'text-gray-500'
              )}>
                {diasParaVencer < 0
                  ? `Vencida há ${Math.abs(diasParaVencer)} dia(s)`
                  : diasParaVencer === 0
                  ? 'Vence hoje'
                  : `Vence em ${diasParaVencer} dia(s)`}
              </p>
            )}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="card">
          <h3 className="font-sora font-semibold text-gray-800 mb-4">Dados da Licença</h3>
          <dl className="space-y-3 text-sm">
            <div>
              <dt className="text-gray-400 text-xs uppercase tracking-wide">CPF/CNPJ</dt>
              <dd className="text-gray-700 font-medium">{licenca.cpfCnpj}</dd>
            </div>
            <div>
              <dt className="text-gray-400 text-xs uppercase tracking-wide">Atividade</dt>
              <dd className="text-gray-700 font-medium">{licenca.atividade}</dd>
            </div>
            <div>
              <dt className="text-gray-400 text-xs uppercase tracking-wide">Endereço</dt>
              <dd className="text-gray-700 font-medium">{licenca.endereco}</dd>
            </div>
            {licenca.municipio && (
              <div>
                <dt className="text-gray-400 text-xs uppercase tracking-wide">Município</dt>
                <dd className="text-gray-700 font-medium">{licenca.municipio}</dd>
              </div>
            )}
            <div>
              <dt className="text-gray-400 text-xs uppercase tracking-wide">Fiscal responsável</dt>
              <dd className="text-gray-700 font-medium">{licenca.fiscalResponsavel?.nome ?? 'Não atribuído'}</dd>
            </div>
          </dl>
        </div>

        <div className="card">
          <h3 className="font-sora font-semibold text-gray-800 mb-4">Rastreabilidade</h3>
          <dl className="space-y-3 text-sm">
            <div>
              <dt className="text-gray-400 text-xs uppercase tracking-wide">Criada em</dt>
              <dd className="text-gray-700 font-medium">{formatDateTime(licenca.criadoEm)}</dd>
            </div>
            <div>
              <dt className="text-gray-400 text-xs uppercase tracking-wide">Atualizada em</dt>
              <dd className="text-gray-700 font-medium">{formatDateTime(licenca.atualizadoEm)}</dd>
            </div>
            <div>
              <dt className="text-gray-400 text-xs uppercase tracking-wide">Vistorias vinculadas</dt>
              <dd className="text-gray-700 font-medium">{licenca.vistorias.length}</dd>
            </div>
          </dl>
        </div>
      </div>

      <div className="card">
        <h3 className="font-sora font-semibold text-gray-800 mb-4">Vistorias</h3>

        {licenca.vistorias.length === 0 ? (
          <div className="rounded-lg border border-gray-100 bg-gray-50 px-4 py-3 text-sm text-gray-500">
            Nenhuma vistoria vinculada até o momento.
          </div>
        ) : (
          <div className="space-y-2">
            {licenca.vistorias.map((vistoria) => (
              <div key={vistoria.id} className="rounded-lg border border-gray-100 px-4 py-3 flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-medium text-gray-700">{formatDateTime(vistoria.dataAgendada)}</p>
                  <p className="text-xs text-gray-400 mt-0.5">Fiscal: {vistoria.fiscal?.nome ?? 'Não informado'}</p>
                </div>
                <span className="inline-flex items-center gap-1 text-xs text-gray-500">
                  <AlertCircle size={12} />
                  {vistoria.status}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
