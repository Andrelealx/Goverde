import { useState } from 'react';
import { Fingerprint, User, BarChart2, Clock, FileText, Users } from 'lucide-react';
import { cn } from '../utils/cn';
import { useAuthStore } from '../stores/auth.store';
import RegistrarPonto from './ponto/RegistrarPonto';
import CadastroPerfil from './ponto/CadastroPerfil';
import RelatorioPonto from './ponto/RelatorioPonto';
import EspelhoPonto from './ponto/EspelhoPonto';
import Atestados from './ponto/Atestados';
import GestaoEquipe from './ponto/GestaoEquipe';

const abas = [
  { id: 'registrar', label: 'Registrar', icon: Fingerprint, roles: ['all'] },
  { id: 'perfil', label: 'Meu Rosto', icon: User, roles: ['all'] },
  { id: 'espelho', label: 'Espelho', icon: Clock, roles: ['all'] },
  { id: 'atestados', label: 'Atestados', icon: FileText, roles: ['all'] },
  { id: 'relatorio', label: 'Relatório', icon: BarChart2, roles: ['SECRETARIO', 'ADMIN_SISTEMA'] },
  { id: 'equipe', label: 'Gestão de Equipe', icon: Users, roles: ['SECRETARIO', 'ADMIN_SISTEMA'] },
];

export default function Ponto() {
  const [abaAtiva, setAbaAtiva] = useState('registrar');
  const { usuario } = useAuthStore();

  const abasVisiveis = abas.filter(
    (a) => a.roles.includes('all') || a.roles.includes(usuario?.papel ?? '')
  );

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-sora font-bold text-gray-800 text-xl">Ponto Eletrônico</h2>
        <p className="text-sm text-gray-400 mt-0.5">Controle de jornada com reconhecimento facial e banco de horas</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-xl p-1 w-fit overflow-x-auto">
        {abasVisiveis.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setAbaAtiva(id)}
            className={cn(
              'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap',
              abaAtiva === id
                ? 'bg-white shadow text-primary'
                : 'text-gray-500 hover:text-gray-700'
            )}
          >
            <Icon size={15} />
            {label}
          </button>
        ))}
      </div>

      {abaAtiva === 'registrar' && <RegistrarPonto />}
      {abaAtiva === 'perfil' && <CadastroPerfil />}
      {abaAtiva === 'espelho' && <EspelhoPonto />}
      {abaAtiva === 'atestados' && <Atestados />}
      {abaAtiva === 'relatorio' && <RelatorioPonto />}
      {abaAtiva === 'equipe' && <GestaoEquipe />}
    </div>
  );
}
