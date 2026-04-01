import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import NovaDenuncia from './pages/NovaDenuncia';
import ConsultarProtocolo from './pages/ConsultarProtocolo';
import Mapa from './pages/Mapa';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/denuncia" element={<NovaDenuncia />} />
        <Route path="/protocolo" element={<ConsultarProtocolo />} />
        <Route path="/mapa" element={<Mapa />} />
      </Routes>
    </BrowserRouter>
  );
}
