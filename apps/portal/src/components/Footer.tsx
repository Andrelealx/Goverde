import { Link } from 'react-router-dom';
import { Leaf, Mail, Phone } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-primary-700 text-white mt-16">
      <div className="max-w-5xl mx-auto px-4 py-10 grid grid-cols-1 sm:grid-cols-3 gap-8">
        <div>
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 bg-white/10 rounded-lg flex items-center justify-center">
              <Leaf size={16} className="text-white" />
            </div>
            <span className="font-sora font-bold text-lg">Goverde</span>
          </div>
          <p className="text-primary-200 text-sm leading-relaxed">
            Plataforma de gestão ambiental para municípios brasileiros.
          </p>
        </div>

        <div>
          <h4 className="font-semibold text-sm mb-3 text-primary-100">Links úteis</h4>
          <ul className="space-y-2 text-sm text-primary-200">
            <li><Link to="/" className="hover:text-white transition-colors">Início</Link></li>
            <li><Link to="/denuncia" className="hover:text-white transition-colors">Registrar denúncia</Link></li>
            <li><Link to="/protocolo" className="hover:text-white transition-colors">Consultar protocolo</Link></li>
            <li><Link to="/mapa" className="hover:text-white transition-colors">Mapa de ocorrências</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="font-semibold text-sm mb-3 text-primary-100">Contato</h4>
          <ul className="space-y-2 text-sm text-primary-200">
            <li className="flex items-center gap-2"><Phone size={13} /> (21) 3636-0000</li>
            <li className="flex items-center gap-2"><Mail size={13} /> meioambiente@municipio.gov.br</li>
          </ul>
        </div>
      </div>
      <div className="border-t border-primary-600 text-center text-xs text-primary-300 py-4">
        © {new Date().getFullYear()} Goverde · Todos os direitos reservados
      </div>
    </footer>
  );
}
