import { Link, Outlet, useLocation } from 'react-router-dom';
import { useEffect, useMemo, useState } from 'react';
import Sidebar from './Sidebar';
import Topbar from './Topbar';
import BottomNav from './BottomNav';
import ChatIA from '../ia/ChatIA';
import { useAuthStore } from '../../stores/auth.store';
import { LogOut, X } from 'lucide-react';

const pageTitles: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/desempenho': 'Desempenho',
  '/ocorrencias': 'Ocorrências',
  '/ocorrencias/nova': 'Nova Ocorrência',
  '/licencas': 'Licenças Ambientais',
  '/licencas/nova': 'Nova Licença',
  '/licencas/': 'Detalhe de Licença',
  '/vistorias': 'Vistorias',
  '/ponto': 'Ponto Eletrônico',
  '/multas': 'Auto de Infração',
  '/agenda': 'Agenda',
  '/auditoria': 'Auditoria',
  '/usuarios': 'Usuários',
  '/configuracoes': 'Configurações',
};

const mobileMenuItems: Array<{ to: string; label: string; roles?: string[] }> = [
  { to: '/dashboard', label: 'Dashboard' },
  { to: '/desempenho', label: 'Desempenho', roles: ['SECRETARIO', 'ADMIN_SISTEMA'] },
  { to: '/ocorrencias', label: 'Ocorrências' },
  { to: '/licencas', label: 'Licenças' },
  { to: '/vistorias', label: 'Vistorias' },
  { to: '/ponto', label: 'Ponto Eletrônico' },
  { to: '/multas', label: 'Auto de Infração' },
  { to: '/agenda', label: 'Agenda' },
  { to: '/usuarios', label: 'Usuários', roles: ['SECRETARIO', 'ADMIN_SISTEMA'] },
  { to: '/auditoria', label: 'Auditoria', roles: ['SECRETARIO', 'ADMIN_SISTEMA'] },
  { to: '/configuracoes', label: 'Configurações' },
];

export default function AppLayout() {
  const { usuario, logout } = useAuthStore();
  const location = useLocation();
  const [menuAberto, setMenuAberto] = useState(false);

  const titleKey = Object.keys(pageTitles)
    .sort((a, b) => b.length - a.length)
    .find((k) => location.pathname.startsWith(k));
  const title = titleKey ? pageTitles[titleKey] : 'Goverde';

  const itensMobile = useMemo(
    () => mobileMenuItems.filter((item) => !item.roles || item.roles.includes(usuario?.papel ?? '')),
    [usuario?.papel]
  );

  useEffect(() => {
    setMenuAberto(false);
  }, [location.pathname]);

  useEffect(() => {
    document.body.style.overflow = menuAberto ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [menuAberto]);

  const isActiveMobileItem = (to: string) =>
    location.pathname === to || (to !== '/dashboard' && location.pathname.startsWith(`${to}/`));

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Topbar title={title} onMenuClick={() => setMenuAberto((prev) => !prev)} />
        <main className="flex-1 overflow-y-auto p-6 pb-20 lg:pb-6">
          <Outlet />
        </main>
      </div>
      <BottomNav />
      <ChatIA />

      {menuAberto && (
        <div className="lg:hidden fixed inset-0 z-[60]">
          <button
            aria-label="Fechar menu"
            className="absolute inset-0 bg-black/40"
            onClick={() => setMenuAberto(false)}
          />

          <aside className="absolute left-0 top-0 h-full w-72 max-w-[85vw] bg-white border-r border-gray-200 shadow-xl flex flex-col">
            <div className="h-16 px-4 flex items-center justify-between border-b border-gray-100">
              <div>
                <p className="font-sora font-semibold text-gray-800">Menu</p>
                <p className="text-xs text-gray-400 truncate">{usuario?.tenant?.nome}</p>
              </div>
              <button
                aria-label="Fechar menu"
                onClick={() => setMenuAberto(false)}
                className="p-2 rounded-lg text-gray-500 hover:bg-gray-100"
              >
                <X size={18} />
              </button>
            </div>

            <nav className="flex-1 overflow-y-auto p-3 space-y-1">
              {itensMobile.map((item) => (
                <Link
                  key={item.to}
                  to={item.to}
                  className={[
                    'block rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                    isActiveMobileItem(item.to)
                      ? 'bg-primary-50 text-primary-700'
                      : 'text-gray-600 hover:bg-gray-50',
                  ].join(' ')}
                >
                  {item.label}
                </Link>
              ))}
            </nav>

            <div className="p-3 border-t border-gray-100">
              <button
                onClick={() => logout()}
                className="w-full flex items-center justify-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium text-red-600 bg-red-50 hover:bg-red-100 transition-colors"
              >
                <LogOut size={16} />
                Sair
              </button>
            </div>
          </aside>
        </div>
      )}
    </div>
  );
}
