import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { criarOcorrenciaSchema, CriarOcorrenciaInput, categoriaOcorrenciaValues, prioridadeValues } from '@goverde/shared';
import { categoriaLabel, prioridadeLabel } from '../utils/formatters';
import api from '../services/api';
import { Upload, X } from 'lucide-react';

export default function NovaOcorrencia() {
  const navigate = useNavigate();
  const [fotos, setFotos] = useState<File[]>([]);
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CriarOcorrenciaInput>({
    resolver: zodResolver(criarOcorrenciaSchema),
    defaultValues: { prioridade: 'MEDIA' },
  });

  const handleFotos = (e: React.ChangeEvent<HTMLInputElement>) => {
    const arquivos = Array.from(e.target.files ?? []);
    setFotos((prev) => [...prev, ...arquivos].slice(0, 5));
  };

  const removerFoto = (index: number) => {
    setFotos((prev) => prev.filter((_, i) => i !== index));
  };

  const onSubmit = async (dados: CriarOcorrenciaInput) => {
    setEnviando(true);
    setErro('');
    try {
      const formData = new FormData();
      formData.append('dados', JSON.stringify(dados));
      fotos.forEach((f) => formData.append('fotos', f));

      const { data } = await api.post('/api/ocorrencias', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      navigate(`/ocorrencias/${data.id}`);
    } catch (err: any) {
      setErro(err.response?.data?.message ?? 'Erro ao criar ocorrência');
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="card">
        <h2 className="font-sora font-semibold text-lg text-gray-800 mb-6">Registrar Ocorrência</h2>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          {/* Título */}
          <div>
            <label className="label">Título *</label>
            <input {...register('titulo')} className="input" placeholder="Descreva brevemente o problema" />
            {errors.titulo && <p className="text-xs text-danger mt-1">{errors.titulo.message}</p>}
          </div>

          {/* Categoria + Prioridade */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Categoria *</label>
              <select {...register('categoria')} className="input">
                <option value="">Selecione...</option>
                {categoriaOcorrenciaValues.map((c) => (
                  <option key={c} value={c}>{categoriaLabel[c]}</option>
                ))}
              </select>
              {errors.categoria && <p className="text-xs text-danger mt-1">{errors.categoria.message}</p>}
            </div>
            <div>
              <label className="label">Prioridade</label>
              <select {...register('prioridade')} className="input">
                {prioridadeValues.map((p) => (
                  <option key={p} value={p}>{prioridadeLabel[p]}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Descrição */}
          <div>
            <label className="label">Descrição *</label>
            <textarea
              {...register('descricao')}
              rows={4}
              className="input resize-none"
              placeholder="Descreva detalhadamente o problema observado..."
            />
            {errors.descricao && <p className="text-xs text-danger mt-1">{errors.descricao.message}</p>}
          </div>

          {/* Localização */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Bairro</label>
              <input {...register('bairro')} className="input" placeholder="Nome do bairro" />
            </div>
            <div>
              <label className="label">Endereço</label>
              <input {...register('endereco')} className="input" placeholder="Rua, número..." />
            </div>
          </div>

          {/* Coordenadas */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Latitude</label>
              <input
                {...register('latitude', { valueAsNumber: true })}
                type="number"
                step="any"
                className="input"
                placeholder="-22.5500"
              />
            </div>
            <div>
              <label className="label">Longitude</label>
              <input
                {...register('longitude', { valueAsNumber: true })}
                type="number"
                step="any"
                className="input"
                placeholder="-43.1500"
              />
            </div>
          </div>

          {/* Denunciante */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Nome do Denunciante</label>
              <input {...register('nomeDenunciante')} className="input" placeholder="Opcional" />
            </div>
            <div>
              <label className="label">Contato</label>
              <input {...register('contatoDenunciante')} className="input" placeholder="Telefone ou e-mail" />
            </div>
          </div>

          {/* Upload de fotos */}
          <div>
            <label className="label">Fotos (máx. 5)</label>
            <label className="flex flex-col items-center justify-center w-full h-28 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-primary transition-colors bg-gray-50">
              <Upload size={20} className="text-gray-400 mb-1" />
              <span className="text-sm text-gray-400">Clique para adicionar fotos</span>
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                multiple
                onChange={handleFotos}
                className="hidden"
              />
            </label>

            {fotos.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-3">
                {fotos.map((f, i) => (
                  <div key={i} className="relative">
                    <img
                      src={URL.createObjectURL(f)}
                      alt={f.name}
                      className="w-16 h-16 object-cover rounded-lg"
                    />
                    <button
                      type="button"
                      onClick={() => removerFoto(i)}
                      className="absolute -top-1 -right-1 w-5 h-5 bg-danger rounded-full flex items-center justify-center"
                    >
                      <X size={10} className="text-white" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {erro && (
            <p className="text-sm text-danger bg-red-50 border border-red-200 rounded-lg px-3 py-2">
              {erro}
            </p>
          )}

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={() => navigate('/ocorrencias')}
              className="btn-secondary flex-1"
            >
              Cancelar
            </button>
            <button type="submit" disabled={enviando} className="btn-primary flex-1">
              {enviando ? 'Salvando...' : 'Registrar Ocorrência'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
