import { useRef, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Camera, MapPin, CheckCircle, AlertCircle, Clock, Fingerprint } from 'lucide-react';
import { useFaceApi } from '../../hooks/useFaceApi';
import { useGeolocalizacao } from '../../hooks/useGeolocalizacao';
import api from '../../services/api';
import { formatDateTime } from '../../utils/formatters';

const tipoLabel: Record<string, string> = {
  ENTRADA: 'Entrada',
  ALMOCO_SAIDA: 'Saída p/ Almoço',
  ALMOCO_VOLTA: 'Volta do Almoço',
  SAIDA: 'Saída',
  ENCERRADO: 'Encerrado',
};

const tipoColor: Record<string, string> = {
  ENTRADA: 'bg-green-500',
  ALMOCO_SAIDA: 'bg-yellow-500',
  ALMOCO_VOLTA: 'bg-blue-500',
  SAIDA: 'bg-gray-500',
};

export default function RegistrarPonto() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const { carregado, erro: erroModelo, detectarRosto, compararDescritores } = useFaceApi();
  const { obter: obterLocalizacao } = useGeolocalizacao();

  const [etapa, setEtapa] = useState<'aguardando' | 'camera' | 'verificando' | 'sucesso' | 'falha'>('aguardando');
  const [msg, setMsg] = useState('');
  const [similaridade, setSimilaridade] = useState(0);
  const [proximoTipo, setProximoTipo] = useState('ENTRADA');
  const [pontosHoje, setPontosHoje] = useState<any[]>([]);
  const [ultimoPonto, setUltimoPonto] = useState<any>(null);
  const [perfil, setPerfil] = useState<{ descritores: number[][] } | null>(null);

  useEffect(() => {
    carregarResumo();
  }, []);

  // Atribui o stream ao vídeo DEPOIS que o elemento é montado no DOM
  useEffect(() => {
    if ((etapa === 'camera' || etapa === 'verificando') && videoRef.current && streamRef.current) {
      videoRef.current.srcObject = streamRef.current;
    }
  }, [etapa]);

  const carregarResumo = async () => {
    try {
      const [resumo, perfilData] = await Promise.all([
        api.get('/api/ponto/resumo'),
        api.get('/api/ponto/perfil-facial'),
      ]);
      setProximoTipo(resumo.data.proximoTipo);
      setPontosHoje(resumo.data.pontosHoje);
      setUltimoPonto(resumo.data.ultimoPonto);
      setPerfil(perfilData.data);
    } catch {}
  };

  const iniciarCamera = async () => {
    if (!perfil) {
      setMsg('Cadastre seu perfil facial antes de registrar o ponto.');
      return;
    }
    if (proximoTipo === 'ENCERRADO') {
      setMsg('Você já completou todos os registros de hoje.');
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480, facingMode: 'user' },
      });
      streamRef.current = stream;
      setEtapa('camera'); // React renderiza o <video>, depois o useEffect atribui o stream
      setMsg('');
    } catch {
      setMsg('Não foi possível acessar a câmera.');
    }
  };

  const pararCamera = () => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  };

  const verificarERegistrar = async () => {
    if (!videoRef.current || !perfil || !carregado) return;

    // Capturar foto AGORA, enquanto o vídeo ainda está ativo e com dimensões
    let fotoCaptura: string | undefined;
    if (videoRef.current.videoWidth > 0) {
      const canvas = document.createElement('canvas');
      const maxW = 320;
      const ratio = maxW / videoRef.current.videoWidth;
      canvas.width = maxW;
      canvas.height = Math.round(videoRef.current.videoHeight * ratio);
      canvas.getContext('2d')!.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
      fotoCaptura = canvas.toDataURL('image/jpeg', 0.5);
    }

    setEtapa('verificando');
    setMsg('Verificando identidade...');

    try {
      const deteccao = await detectarRosto(videoRef.current);
      if (!deteccao) {
        setMsg('Nenhum rosto detectado. Posicione melhor e tente novamente.');
        setEtapa('camera');
        return;
      }

      const sim = await compararDescritores(perfil.descritores, deteccao.descriptor);
      setSimilaridade(sim);

      if (sim < 0.4) {
        pararCamera();
        setEtapa('falha');
        setMsg(`Identidade não confirmada (${Math.round(sim * 100)}% similaridade). Tente novamente com boa iluminação.`);
        return;
      }

      setMsg('Identidade confirmada! Obtendo localização...');

      let coords;
      try {
        coords = await obterLocalizacao();
      } catch (e: any) {
        setMsg('Identidade confirmada, mas não foi possível obter localização: ' + e.message);
        pararCamera();
        setEtapa('falha');
        return;
      }


      await api.post('/api/ponto', {
        tipo: proximoTipo,
        latitude: coords.latitude,
        longitude: coords.longitude,
        precisao: coords.precisao,
        verificacaoFacial: true,
        similaridade: sim,
        fotoCaptura,
      });

      pararCamera();
      setEtapa('sucesso');
      await carregarResumo();
    } catch (err: any) {
      pararCamera();
      console.error('[Ponto] Erro:', err);
      const msg = err.response?.data?.message
        ?? err.message
        ?? 'Erro ao registrar ponto.';
      setMsg(msg);
      setEtapa('falha');
    }
  };

  useEffect(() => () => pararCamera(), []);

  if (!carregado && !erroModelo) {
    return (
      <div className="card flex items-center gap-3 text-gray-400 text-sm">
        <div className="animate-spin h-5 w-5 border-2 border-primary border-t-transparent rounded-full" />
        Carregando modelos de reconhecimento facial...
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Painel de registro */}
      <div className="card space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary-50 rounded-xl flex items-center justify-center">
            <Fingerprint size={20} className="text-primary" />
          </div>
          <div>
            <h3 className="font-sora font-semibold text-gray-800">Registrar Ponto</h3>
            <p className="text-xs text-gray-400">
              {new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' })}
            </p>
          </div>
          <div className="ml-auto text-right">
            <p className="font-mono font-bold text-lg text-gray-800">
              {new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
            </p>
          </div>
        </div>

        {erroModelo && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-xs text-yellow-700">
            ⚠️ Modelos de IA não carregados. Baixe os modelos face-api.js para <code>apps/web/public/models/</code>
          </div>
        )}

        {/* Próximo ponto */}
        {proximoTipo !== 'ENCERRADO' ? (
          <div className="bg-primary-50 rounded-xl p-4 text-center">
            <p className="text-xs text-gray-500 mb-1">Próximo registro</p>
            <span className={`inline-block px-4 py-1.5 rounded-full text-white text-sm font-semibold ${tipoColor[proximoTipo] ?? 'bg-gray-400'}`}>
              {tipoLabel[proximoTipo]}
            </span>
          </div>
        ) : (
          <div className="bg-green-50 rounded-xl p-4 text-center">
            <CheckCircle size={24} className="text-success mx-auto mb-1" />
            <p className="text-sm font-medium text-gray-700">Jornada encerrada hoje</p>
          </div>
        )}

        {/* Câmera ou botão */}
        {etapa === 'aguardando' && proximoTipo !== 'ENCERRADO' && (
          <div className="space-y-2">
            {msg && <p className="text-sm text-yellow-600 text-center">{msg}</p>}
            <button
              onClick={iniciarCamera}
              disabled={!carregado || !perfil}
              className="btn-primary w-full flex items-center justify-center gap-2 py-3"
            >
              <Camera size={18} />
              Registrar com Face ID
            </button>
            {!perfil && (
              <p className="text-xs text-center text-gray-400">
                Cadastre seu perfil facial na aba "Meu Perfil"
              </p>
            )}
          </div>
        )}

        {etapa === 'camera' && (
          <div className="space-y-3">
            <div className="relative rounded-xl overflow-hidden bg-black">
              <video ref={videoRef} className="w-full" autoPlay muted playsInline />
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="w-36 h-44 border-4 border-white/70 rounded-full animate-pulse" />
              </div>
              <div className="absolute bottom-2 left-0 right-0 text-center text-white text-xs">
                Centralize seu rosto no oval
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={() => { pararCamera(); setEtapa('aguardando'); }} className="btn-secondary flex-1">Cancelar</button>
              <button onClick={verificarERegistrar} className="btn-primary flex-1">Verificar e Registrar</button>
            </div>
          </div>
        )}

        {etapa === 'verificando' && (
          <div className="text-center py-6 space-y-3">
            <div className="animate-spin h-10 w-10 border-3 border-primary border-t-transparent rounded-full mx-auto" />
            <p className="text-sm text-gray-500">{msg}</p>
          </div>
        )}

        <AnimatePresence>
          {etapa === 'sucesso' && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="text-center py-4 space-y-2"
            >
              <CheckCircle size={48} className="text-success mx-auto" />
              <p className="font-semibold text-gray-800">Ponto registrado!</p>
              <p className="text-sm text-gray-400">
                Similaridade facial: {Math.round(similaridade * 100)}%
              </p>
              <button onClick={() => setEtapa('aguardando')} className="btn-secondary text-sm mt-2">
                Voltar
              </button>
            </motion.div>
          )}

          {etapa === 'falha' && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="text-center py-4 space-y-2"
            >
              <AlertCircle size={48} className="text-danger mx-auto" />
              <p className="font-semibold text-gray-800">Verificação falhou</p>
              <p className="text-sm text-gray-500 max-w-xs mx-auto">{msg}</p>
              <button onClick={() => setEtapa('aguardando')} className="btn-primary text-sm mt-2">
                Tentar novamente
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Histórico do dia */}
      <div className="card">
        <h3 className="font-sora font-semibold text-gray-700 mb-4 flex items-center gap-2">
          <Clock size={16} className="text-primary" />
          Registros de hoje
        </h3>

        {pontosHoje.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-8">Nenhum registro hoje.</p>
        ) : (
          <div className="space-y-2">
            {pontosHoje.map((p: any) => (
              <div key={p.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <div className={`w-2.5 h-2.5 rounded-full ${tipoColor[p.tipo] ?? 'bg-gray-400'}`} />
                <div className="flex-1">
                  <p className="text-sm font-medium">{tipoLabel[p.tipo]}</p>
                  <p className="text-xs text-gray-400">
                    {formatDateTime(p.criadoEm)}
                  </p>
                  {p.enderecoAprox && (
                    <p className="text-xs text-gray-400 flex items-center gap-1">
                      <MapPin size={10} /> {p.enderecoAprox}
                    </p>
                  )}
                </div>
                {p.verificacaoFacial && (
                  <div className="flex items-center gap-1 text-xs text-success">
                    <Fingerprint size={12} />
                    {p.similaridade ? `${Math.round(p.similaridade * 100)}%` : 'OK'}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {pontosHoje.length > 0 && ultimoPonto && (
          <div className="mt-4 pt-4 border-t border-gray-100 text-xs text-gray-400 flex items-center gap-1">
            <MapPin size={12} />
            Lat {ultimoPonto.latitude?.toFixed(5)}, Lon {ultimoPonto.longitude?.toFixed(5)}
          </div>
        )}
      </div>
    </div>
  );
}
