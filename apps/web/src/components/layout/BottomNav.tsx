import { NavLink } from 'react-router-dom';
import { LayoutDashboard, AlertTriangle, FileText, Fingerprint, Settings } from 'lucide-react';
import { cn } from '../../utils/cn';

const items = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/ocorrencias', label: 'Ocorrências', icon: AlertTriangle },
  { to: '/licencas', label: 'Licenças', icon: FileText },
  { to: '/ponto', label: 'Ponto', icon: Fingerprint },
  { to: '/configuracoes', label: 'Mais', icon: Settings },
];

export default function BottomNav() {
  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50 safe-area-pb">
      <div className="flex">
        {items.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              cn(
                'flex-1 flex flex-col items-center py-2 gap-0.5 text-xs transition-colors',
                isActive ? 'text-primary' : 'text-gray-400'
              )
            }
          >
            {({ isActive }) => (
              <>
                <Icon size={20} strokeWidth={isActive ? 2.5 : 1.5} />
                <span>{label}</span>
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
