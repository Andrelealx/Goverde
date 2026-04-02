import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, AlertTriangle, FileText, CalendarDays,
  Users, Settings, LogOut, Leaf, Fingerprint, ChevronLeft, ChevronRight, Scale, Calendar,
} from 'lucide-react';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthStore } from '../../stores/auth.store';
import { cn } from '../../utils/cn';

interface NavItem {
  to: string;
  label: string;
  icon: React.ElementType;
  roles?: string[];
}

const navItems: NavItem[] = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/ocorrencias', label: 'Ocorrências', icon: AlertTriangle },
  { to: '/licencas', label: 'Licenças', icon: FileText },
  { to: '/vistorias', label: 'Vistorias', icon: CalendarDays },
  { to: '/ponto', label: 'Ponto Eletrônico', icon: Fingerprint },
  { to: '/multas', label: 'Auto de Infração', icon: Scale },
  { to: '/agenda', label: 'Agenda', icon: Calendar },
  { to: '/usuarios', label: 'Usuários', icon: Users, roles: ['SECRETARIO', 'ADMIN_SISTEMA'] },
  { to: '/configuracoes', label: 'Configurações', icon: Settings },
];

export default function Sidebar() {
  const { usuario, logout } = useAuthStore();
  const navigate = useNavigate();
  const [colapsado, setColapsado] = useState(false);

  const itemsVisiveis = navItems.filter(
    (item) => !item.roles || item.roles.includes(usuario?.papel ?? '')
  );

  return (
    <motion.aside
      animate={{ width: colapsado ? 64 : 240 }}
      transition={{ duration: 0.25, ease: 'easeInOut' }}
      className="hidden lg:flex flex-col bg-primary-500 text-white min-h-screen shrink-0 relative"
    >
      {/* Logo */}
      <div className={cn(
        'flex items-center gap-2 px-4 py-5 border-b border-primary-600',
        colapsado && 'justify-center'
      )}>
        <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center shrink-0">
          <Leaf size={16} className="text-white" />
        </div>
        <AnimatePresence>
          {!colapsado && (
            <motion.div
              initial={{ opacity: 0, width: 0 }}
              animate={{ opacity: 1, width: 'auto' }}
              exit={{ opacity: 0, width: 0 }}
              className="overflow-hidden"
            >
              <span className="font-sora font-bold text-lg leading-none whitespace-nowrap">Goverde</span>
              <p className="text-xs text-primary-200 mt-0.5 truncate max-w-[140px]">
                {usuario?.tenant?.nome}
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-2 py-4 space-y-0.5">
        {itemsVisiveis.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            title={colapsado ? label : undefined}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                colapsado && 'justify-center',
                isActive
                  ? 'bg-white/20 text-white'
                  : 'text-primary-100 hover:bg-white/10 hover:text-white'
              )
            }
          >
            <Icon size={18} className="shrink-0" />
            <AnimatePresence>
              {!colapsado && (
                <motion.span
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="whitespace-nowrap"
                >
                  {label}
                </motion.span>
              )}
            </AnimatePresence>
          </NavLink>
        ))}
      </nav>

      {/* User */}
      {!colapsado && (
        <div className="px-4 py-4 border-t border-primary-600">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 rounded-full bg-primary-300 flex items-center justify-center text-sm font-bold shrink-0">
              {usuario?.nome?.[0]?.toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium truncate">{usuario?.nome}</p>
              <p className="text-xs text-primary-200 truncate">{usuario?.papel}</p>
            </div>
          </div>
          <button
            onClick={() => logout()}
            className="flex items-center gap-2 w-full px-3 py-2 text-sm text-primary-100 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
          >
            <LogOut size={16} />
            Sair
          </button>
        </div>
      )}

      {colapsado && (
        <div className="px-2 pb-4 border-t border-primary-600 pt-3 flex flex-col items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-primary-300 flex items-center justify-center text-sm font-bold">
            {usuario?.nome?.[0]?.toUpperCase()}
          </div>
          <button onClick={() => logout()} title="Sair">
            <LogOut size={16} className="text-primary-200 hover:text-white" />
          </button>
        </div>
      )}

      {/* Botão colapsar */}
      <button
        onClick={() => setColapsado(!colapsado)}
        className="absolute -right-3 top-20 w-6 h-6 bg-primary-600 rounded-full flex items-center justify-center shadow border border-primary-400 text-white hover:bg-primary-500 transition-colors"
      >
        {colapsado ? <ChevronRight size={12} /> : <ChevronLeft size={12} />}
      </button>
    </motion.aside>
  );
}
