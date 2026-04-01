import { Bell, Menu } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useAuthStore } from '../../stores/auth.store';
import api from '../../services/api';
import { cn } from '../../utils/cn';

interface TopbarProps {
  title: string;
  onMenuClick?: () => void;
}

export default function Topbar({ title, onMenuClick }: TopbarProps) {
  const { usuario } = useAuthStore();
  const [notifCount, setNotifCount] = useState(0);
  const [open, setOpen] = useState(false);
  const [notifs, setNotifs] = useState<{ tipo: string; mensagem: string }[]>([]);

  useEffect(() => {
    api.get('/api/notificacoes').then(({ data }) => {
      setNotifs(data);
      setNotifCount(data.length);
    }).catch(() => {});
  }, []);

  return (
    <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6 relative z-10">
      <div className="flex items-center gap-4">
        <button onClick={onMenuClick} className="lg:hidden p-1 rounded-lg hover:bg-gray-100">
          <Menu size={20} />
        </button>
        <h1 className="font-sora font-semibold text-gray-800 text-lg">{title}</h1>
      </div>

      <div className="flex items-center gap-3">
        {/* Notificações */}
        <div className="relative">
          <button
            onClick={() => setOpen(!open)}
            className="relative p-2 rounded-lg hover:bg-gray-100 text-gray-500"
          >
            <Bell size={18} />
            {notifCount > 0 && (
              <span className="absolute top-1 right-1 w-2 h-2 bg-danger rounded-full" />
            )}
          </button>

          {open && (
            <div className="absolute right-0 top-10 w-80 bg-white rounded-xl shadow-lg border border-gray-100 py-2 z-50">
              <p className="px-4 py-2 text-xs font-medium text-gray-400 uppercase">Alertas</p>
              {notifs.length === 0 ? (
                <p className="px-4 py-3 text-sm text-gray-400">Nenhum alerta no momento.</p>
              ) : (
                notifs.map((n, i) => (
                  <div
                    key={i}
                    className={cn(
                      'px-4 py-2.5 text-sm border-l-4 mx-2 rounded-r mb-1',
                      n.tipo === 'alerta' ? 'border-danger bg-red-50' :
                      n.tipo === 'aviso' ? 'border-warning bg-yellow-50' :
                      'border-blue-400 bg-blue-50'
                    )}
                  >
                    {n.mensagem}
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        <div className="w-8 h-8 rounded-full bg-primary-500 flex items-center justify-center text-white text-sm font-bold">
          {usuario?.nome?.[0]?.toUpperCase()}
        </div>
      </div>
    </header>
  );
}
