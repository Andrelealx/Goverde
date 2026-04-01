import { useEffect, useState } from 'react';
import { Plus, UserCheck, UserX } from 'lucide-react';
import api from '../services/api';
import { formatDate } from '../utils/formatters';
import { cn } from '../utils/cn';

interface Usuario {
  id: string;
  nome: string;
  email: string;
  papel: string;
  ativo: boolean;
  criadoEm: string;
}

const papelLabel: Record<string, string> = {
  ADMIN_SISTEMA: 'Admin Sistema',
  SECRETARIO: 'Secretário',
  FISCAL: 'Fiscal',
  OPERADOR: 'Operador',
};

export default function Usuarios() {
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ nome: '', email: '', senha: '', papel: 'FISCAL' });
  const [salvando, setSalvando] = useState(false);

  const carregar = () => {
    api.get('/api/usuarios').then(({ data }) => setUsuarios(data)).finally(() => setCarregando(false));
  };

  useEffect(() => {
    carregar();
  }, []);

  const toggleAtivo = async (id: string, ativo: boolean) => {
    await api.patch(`/api/usuarios/${id}/ativo`, { ativo: !ativo });
    setUsuarios((prev) => prev.map((u) => u.id === id ? { ...u, ativo: !ativo } : u));
  };

  const criarUsuario = async (e: React.FormEvent) => {
    e.preventDefault();
    setSalvando(true);
    try {
      await api.post('/api/usuarios', form);
      setShowForm(false);
      setForm({ nome: '', email: '', senha: '', papel: 'FISCAL' });
      carregar();
    } finally {
      setSalvando(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">{usuarios.length} usuário(s)</p>
        <button onClick={() => setShowForm(true)} className="btn-primary flex items-center gap-2">
          <Plus size={16} />
          Novo Usuário
        </button>
      </div>

      {showForm && (
        <div className="card">
          <h3 className="font-sora font-medium text-gray-700 mb-4">Novo Usuário</h3>
          <form onSubmit={criarUsuario} className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Nome</label>
              <input
                className="input"
                value={form.nome}
                onChange={(e) => setForm({ ...form, nome: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="label">E-mail</label>
              <input
                type="email"
                className="input"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="label">Senha</label>
              <input
                type="password"
                className="input"
                value={form.senha}
                onChange={(e) => setForm({ ...form, senha: e.target.value })}
                required
                minLength={6}
              />
            </div>
            <div>
              <label className="label">Papel</label>
              <select
                className="input"
                value={form.papel}
                onChange={(e) => setForm({ ...form, papel: e.target.value })}
              >
                {Object.entries(papelLabel).map(([v, l]) => (
                  <option key={v} value={v}>{l}</option>
                ))}
              </select>
            </div>
            <div className="col-span-2 flex gap-3 justify-end">
              <button type="button" onClick={() => setShowForm(false)} className="btn-secondary">
                Cancelar
              </button>
              <button type="submit" disabled={salvando} className="btn-primary">
                {salvando ? 'Salvando...' : 'Criar Usuário'}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="card p-0 overflow-hidden">
        {carregando ? (
          <div className="flex items-center justify-center h-48">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Nome</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">E-mail</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Papel</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Desde</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {usuarios.map((u) => (
                <tr key={u.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium">{u.nome}</td>
                  <td className="px-4 py-3 text-gray-500">{u.email}</td>
                  <td className="px-4 py-3 text-gray-500">{papelLabel[u.papel] ?? u.papel}</td>
                  <td className="px-4 py-3 text-gray-400 text-xs">{formatDate(u.criadoEm)}</td>
                  <td className="px-4 py-3">
                    <span className={cn('badge', u.ativo ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500')}>
                      {u.ativo ? 'Ativo' : 'Inativo'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => toggleAtivo(u.id, u.ativo)}
                      className="text-gray-400 hover:text-gray-600"
                      title={u.ativo ? 'Desativar' : 'Ativar'}
                    >
                      {u.ativo ? <UserX size={16} /> : <UserCheck size={16} />}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
