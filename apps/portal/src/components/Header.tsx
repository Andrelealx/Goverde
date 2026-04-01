import { Link, useLocation } from 'react-router-dom';
import { Leaf, Menu, X } from 'lucide-react';
import { useState } from 'react';

const TENANT_SLUG = import.meta.env.VITE_TENANT_SLUG ?? 'guapimirim';

export default function Header() {
  const [menuAberto, setMenuAberto] = useState(false);
  const location = useLocation();

  const links = [
    { to: '/', label: 'Início' },
    { to: '/denuncia', label: 'Registrar Denúncia' },
    { to: '/protocolo', label: 'Consultar Protocolo' },
    { to: '/mapa', label: 'Mapa' },
  ];

  return (
    <header className="bg-white/90 backdrop-blur-md border-b border-gray-100 sticky top-0 z-30">
      <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
        <Link to="/" className="flex items-center gap-2.5 shrink-0">
          <div className="w-9 h-9 bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl flex items-center justify-center shadow-sm">
            <Leaf size={18} className="text-white" />
          </div>
          <div className="leading-none">
            <span className="font-sora font-bold text-primary-600 text-base">Goverde</span>
            <p className="text-[10px] text-gray-400 capitalize">{TENANT_SLUG}</p>
          </div>
        </Link>

        {/* Nav desktop */}
        <nav className="hidden md:flex items-center gap-1">
          {links.map(({ to, label }) => (
            <Link
              key={to}
              to={to}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                location.pathname === to
                  ? 'bg-primary-50 text-primary-600'
                  : 'text-gray-500 hover:text-gray-800 hover:bg-gray-50'
              }`}
            >
              {label}
            </Link>
          ))}
        </nav>

        <Link
          to="/denuncia"
          className="hidden md:flex items-center gap-1.5 bg-primary-500 hover:bg-primary-600 text-white text-sm font-medium px-4 py-2 rounded-xl transition-colors"
        >
          + Denúncia
        </Link>

        {/* Mobile menu */}
        <button className="md:hidden p-2 text-gray-500" onClick={() => setMenuAberto(!menuAberto)}>
          {menuAberto ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {menuAberto && (
        <div className="md:hidden border-t border-gray-100 bg-white px-4 py-3 space-y-1">
          {links.map(({ to, label }) => (
            <Link
              key={to}
              to={to}
              onClick={() => setMenuAberto(false)}
              className={`block px-3 py-2.5 rounded-xl text-sm font-medium ${
                location.pathname === to
                  ? 'bg-primary-50 text-primary-600'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              {label}
            </Link>
          ))}
        </div>
      )}
    </header>
  );
}
