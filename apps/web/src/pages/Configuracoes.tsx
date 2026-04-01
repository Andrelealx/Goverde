import { useAuthStore } from '../stores/auth.store';

export default function Configuracoes() {
  const { usuario } = useAuthStore();

  return (
    <div className="max-w-2xl space-y-6">
      <div className="card">
        <h2 className="font-sora font-semibold text-gray-800 mb-4">Dados do Município</h2>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-gray-400 text-xs mb-0.5">Nome</p>
            <p className="font-medium">{usuario?.tenant?.nome}</p>
          </div>
          <div>
            <p className="text-gray-400 text-xs mb-0.5">Slug</p>
            <p className="font-mono text-primary">{usuario?.tenant?.slug}</p>
          </div>
        </div>
      </div>

      <div className="card">
        <h2 className="font-sora font-semibold text-gray-800 mb-4">Minha Conta</h2>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-gray-400 text-xs mb-0.5">Nome</p>
            <p className="font-medium">{usuario?.nome}</p>
          </div>
          <div>
            <p className="text-gray-400 text-xs mb-0.5">E-mail</p>
            <p>{usuario?.email}</p>
          </div>
          <div>
            <p className="text-gray-400 text-xs mb-0.5">Papel</p>
            <p>{usuario?.papel}</p>
          </div>
        </div>
      </div>

      <div className="card bg-primary-50 border-primary-200">
        <p className="text-sm text-primary-700">
          Para alterar dados do município ou configurações avançadas, entre em contato com o suporte Goverde.
        </p>
      </div>
    </div>
  );
}
