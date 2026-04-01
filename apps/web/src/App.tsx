import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './stores/auth.store';
import AppLayout from './components/layout/AppLayout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Ocorrencias from './pages/Ocorrencias';
import NovaOcorrencia from './pages/NovaOcorrencia';
import DetalheOcorrencia from './pages/DetalheOcorrencia';
import Licencas from './pages/Licencas';
import Vistorias from './pages/Vistorias';
import Usuarios from './pages/Usuarios';
import Configuracoes from './pages/Configuracoes';
import Ponto from './pages/Ponto';
import Multas from './pages/Multas';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { usuario } = useAuthStore();
  if (!usuario) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <AppLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="ocorrencias" element={<Ocorrencias />} />
          <Route path="ocorrencias/nova" element={<NovaOcorrencia />} />
          <Route path="ocorrencias/:id" element={<DetalheOcorrencia />} />
          <Route path="licencas" element={<Licencas />} />
          <Route path="vistorias" element={<Vistorias />} />
          <Route path="ponto" element={<Ponto />} />
          <Route path="multas" element={<Multas />} />
          <Route path="usuarios" element={<Usuarios />} />
          <Route path="configuracoes" element={<Configuracoes />} />
        </Route>
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
