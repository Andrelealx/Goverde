import { FormEvent, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Loader2, Save } from 'lucide-react';
import api from '../services/api';

const tiposLicenca = [
  { value: 'INSTALACAO', label: 'Instalação' },
  { value: 'OPERACAO', label: 'Operação' },
  { value: 'LOCALIZACAO', label: 'Localização' },
  { value: 'SIMPLIFICADA', label: 'Simplificada' },
];

interface FormState {
  tipo: string;
  requerente: string;
  cpfCnpj: string;
  atividade: string;
  endereco: string;
  dataValidade: string;
}

export default function NovaLicenca() {
  const navigate = useNavigate();
  const [form, setForm] = useState<FormState>({
    tipo: 'INSTALACAO',
    requerente: '',
    cpfCnpj: '',
    atividade: '',
    endereco: '',
    dataValidade: '',
  });
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState('');

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setErro('');
    setSalvando(true);

    try {
      const payload: Record<string, string> = {
        tipo: form.tipo,
        requerente: form.requerente.trim(),
        cpfCnpj: form.cpfCnpj.trim(),
        atividade: form.atividade.trim(),
        endereco: form.endereco.trim(),
      };

      if (form.dataValidade) {
        payload.dataValidade = new Date(`${form.dataValidade}T12:00:00`).toISOString();
      }

      const { data } = await api.post('/api/licencas', payload);
      navigate(`/licencas/${data.id}`);
    } catch (err: any) {
      setErro(err?.response?.data?.message ?? 'Não foi possível criar a licença.');
    } finally {
      setSalvando(false);
    }
  };

  return (
    <div className="max-w-3xl space-y-4">
      <button
        onClick={() => navigate('/licencas')}
        className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700"
      >
        <ArrowLeft size={15} />
        Voltar para licenças
      </button>

      <div className="card">
        <h2 className="font-sora font-semibold text-gray-800 text-lg mb-1">Nova Licença</h2>
        <p className="text-sm text-gray-500 mb-6">Preencha os dados para cadastrar uma licença ambiental.</p>

        <form onSubmit={onSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="label">Tipo</label>
              <select
                className="input"
                value={form.tipo}
                onChange={(e) => setForm((prev) => ({ ...prev, tipo: e.target.value }))}
              >
                {tiposLicenca.map((tipo) => (
                  <option key={tipo.value} value={tipo.value}>
                    {tipo.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="label">CPF/CNPJ</label>
              <input
                className="input"
                required
                minLength={11}
                maxLength={18}
                value={form.cpfCnpj}
                onChange={(e) => setForm((prev) => ({ ...prev, cpfCnpj: e.target.value }))}
                placeholder="000.000.000-00 ou 00.000.000/0000-00"
              />
            </div>
          </div>

          <div>
            <label className="label">Requerente</label>
            <input
              className="input"
              required
              minLength={3}
              maxLength={200}
              value={form.requerente}
              onChange={(e) => setForm((prev) => ({ ...prev, requerente: e.target.value }))}
              placeholder="Nome do requerente"
            />
          </div>

          <div>
            <label className="label">Atividade</label>
            <input
              className="input"
              required
              minLength={5}
              maxLength={300}
              value={form.atividade}
              onChange={(e) => setForm((prev) => ({ ...prev, atividade: e.target.value }))}
              placeholder="Descrição da atividade"
            />
          </div>

          <div>
            <label className="label">Endereço</label>
            <input
              className="input"
              required
              minLength={5}
              maxLength={300}
              value={form.endereco}
              onChange={(e) => setForm((prev) => ({ ...prev, endereco: e.target.value }))}
              placeholder="Endereço da atividade"
            />
          </div>

          <div>
            <label className="label">Data de validade (opcional)</label>
            <input
              className="input"
              type="date"
              value={form.dataValidade}
              onChange={(e) => setForm((prev) => ({ ...prev, dataValidade: e.target.value }))}
            />
          </div>

          {erro && (
            <div className="text-sm text-danger bg-red-50 border border-red-200 rounded-lg px-3 py-2">
              {erro}
            </div>
          )}

          <div className="flex items-center gap-3 pt-2">
            <button
              type="button"
              onClick={() => navigate('/licencas')}
              className="btn-secondary"
              disabled={salvando}
            >
              Cancelar
            </button>
            <button type="submit" className="btn-primary inline-flex items-center gap-2" disabled={salvando}>
              {salvando ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Salvando...
                </>
              ) : (
                <>
                  <Save size={16} />
                  Criar Licença
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
