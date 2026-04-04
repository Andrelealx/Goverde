import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './stores/auth.store';
import AppLayout from './components/layout/AppLayout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Ocorrencias from './pages/Ocorrencias';
import NovaOcorrencia from './pages/NovaOcorrencia';
import DetalheOcorrencia from './pages/DetalheOcorrencia';
import Licencas from './pages/Licencas';
import NovaLicenca from './pages/NovaLicenca';
import DetalheLicenca from './pages/DetalheLicenca';
import Vistorias from './pages/Vistorias';
import Usuarios from './pages/Usuarios';
import Configuracoes from './pages/Configuracoes';
import Ponto from './pages/Ponto';
import Multas from './pages/Multas';
import Agenda from './pages/Agenda';
import Desempenho from './pages/Desempenho';
import Auditoria from './pages/Auditoria';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { usuario } = useAuthStore();
  if (!usuario) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function RoteProtegida({
  children,
  roles,
}: {
  children: React.ReactNode;
  roles: string[];
}) {
  const { usuario } = useAuthStore();
  if (!usuario) return <Navigate to="/login" replace />;
  if (!roles.includes(usuario.papel)) return <Navigate to="/dashboard" replace />;
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
          <Route
            path="desempenho"
            element={
              <RoteProtegida roles={['SECRETARIO', 'ADMIN_SISTEMA']}>
                <Desempenho />
              </RoteProtegida>
            }
          />
          <Route path="ocorrencias" element={<Ocorrencias />} />
          <Route path="ocorrencias/nova" element={<NovaOcorrencia />} />
          <Route path="ocorrencias/:id" element={<DetalheOcorrencia />} />
          <Route path="licencas" element={<Licencas />} />
          <Route
            path="licencas/nova"
            element={
              <RoteProtegida roles={['SECRETARIO', 'ADMIN_SISTEMA', 'OPERADOR']}>
                <NovaLicenca />
              </RoteProtegida>
            }
          />
          <Route path="licencas/:id" element={<DetalheLicenca />} />
          <Route path="vistorias" element={<Vistorias />} />
          <Route path="ponto" element={<Ponto />} />
          <Route path="multas" element={<Multas />} />
          <Route path="agenda" element={<Agenda />} />
          <Route
            path="usuarios"
            element={
              <RoteProtegida roles={['SECRETARIO', 'ADMIN_SISTEMA']}>
                <Usuarios />
              </RoteProtegida>
            }
          />
          <Route
            path="auditoria"
            element={
              <RoteProtegida roles={['SECRETARIO', 'ADMIN_SISTEMA']}>
                <Auditoria />
              </RoteProtegida>
            }
          />
          <Route path="configuracoes" element={<Configuracoes />} />
        </Route>
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
