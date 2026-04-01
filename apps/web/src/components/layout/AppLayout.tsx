import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import Topbar from './Topbar';
import BottomNav from './BottomNav';
import ChatIA from '../ia/ChatIA';

const pageTitles: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/ocorrencias': 'Ocorrências',
  '/ocorrencias/nova': 'Nova Ocorrência',
  '/licencas': 'Licenças Ambientais',
  '/vistorias': 'Vistorias',
  '/ponto': 'Ponto Eletrônico',
  '/multas': 'Auto de Infração',
  '/usuarios': 'Usuários',
  '/configuracoes': 'Configurações',
};

export default function AppLayout() {
  const location = useLocation();
  const titleKey = Object.keys(pageTitles)
    .sort((a, b) => b.length - a.length)
    .find((k) => location.pathname.startsWith(k));
  const title = titleKey ? pageTitles[titleKey] : 'Goverde';

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Topbar title={title} />
        <main className="flex-1 overflow-y-auto p-6 pb-20 lg:pb-6">
          <Outlet />
        </main>
      </div>
      <BottomNav />
      <ChatIA />
    </div>
  );
}
