import { useRef, useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import * as faceapi from 'face-api.js';
import { Camera, CheckCircle, AlertCircle, User } from 'lucide-react';
import { useFaceApi } from '../../hooks/useFaceApi';
import api from '../../services/api';

export default function CadastroPerfil({ onConcluido }: { onConcluido?: () => void }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const { carregado, erro: erroModelo, detectarRosto } = useFaceApi();
  const [etapa, setEtapa] = useState<'aguardando' | 'camera' | 'detectando' | 'salvo' | 'erro'>('aguardando');
  const [msg, setMsg] = useState('');
  const [salvando, setSalvando] = useState(false);
  const [perfilExistente, setPerfilExistente] = useState(false);

  useEffect(() => {
    api.get('/api/ponto/perfil-facial').then(({ data }) => {
      if (data) setPerfilExistente(true);
    }).catch(() => {});
  }, []);

  // Atribui o stream ao vídeo DEPOIS que o elemento é montado no DOM
  useEffect(() => {
    if ((etapa === 'camera' || etapa === 'detectando') && videoRef.current && streamRef.current) {
      videoRef.current.srcObject = streamRef.current;
    }
  }, [etapa]);

  const iniciarCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { width: 640, height: 480, facingMode: 'user' } });
      streamRef.current = stream;
      setEtapa('camera'); // primeiro muda etapa → React renderiza o <video> → useEffect atribui o stream
    } catch {
      setEtapa('erro');
      setMsg('Não foi possível acessar a câmera.');
    }
  };

  const pararCamera = () => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  };

  const capturarRosto = async () => {
    if (!videoRef.current || !carregado) return;
    setEtapa('detectando');
    setMsg('Detectando rosto...');

    await new Promise((r) => setTimeout(r, 500));
    const deteccao = await detectarRosto(videoRef.current);

    if (!deteccao) {
      setMsg('Nenhum rosto detectado. Posicione o rosto no centro e tente novamente.');
      setEtapa('camera');
      return;
    }

    // Capturar frame reduzido
    const canvas = document.createElement('canvas');
    const maxW = 320;
    const ratio = maxW / videoRef.current.videoWidth;
    canvas.width = maxW;
    canvas.height = videoRef.current.videoHeight * ratio;
    canvas.getContext('2d')!.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
    const fotoUrl = canvas.toDataURL('image/jpeg', 0.6);

    const descritor = Array.from(deteccao.descriptor);

    setSalvando(true);
    try {
      await api.post('/api/ponto/perfil-facial', {
        descritores: [descritor],
        fotoUrl,
      });
      pararCamera();
      setEtapa('salvo');
      setPerfilExistente(true);
      onConcluido?.();
    } catch {
      setMsg('Erro ao salvar perfil. Tente novamente.');
      setEtapa('camera');
    } finally {
      setSalvando(false);
    }
  };

  useEffect(() => () => pararCamera(), []);

  return (
    <div className="card max-w-md">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 bg-primary-50 rounded-xl flex items-center justify-center">
          <User size={20} className="text-primary" />
        </div>
        <div>
          <h3 className="font-sora font-semibold text-gray-800">Perfil Facial</h3>
          <p className="text-xs text-gray-400">Para identificação no ponto eletrônico</p>
        </div>
        {perfilExistente && (
          <div className="ml-auto flex items-center gap-1 text-xs text-success">
            <CheckCircle size={14} /> Cadastrado
          </div>
        )}
      </div>

      {erroModelo && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-600 mb-4">
          {erroModelo} — Os modelos de IA precisam estar em <code>/public/models</code>.
        </div>
      )}

      {!carregado && !erroModelo && (
        <div className="flex items-center gap-2 text-sm text-gray-400 mb-4">
          <div className="animate-spin h-4 w-4 border-2 border-primary border-t-transparent rounded-full" />
          Carregando modelos de IA...
        </div>
      )}

      {etapa === 'aguardando' && carregado && (
        <div className="text-center py-4">
          <p className="text-sm text-gray-500 mb-4">
            {perfilExistente
              ? 'Você já tem um perfil facial. Deseja recadastrar?'
              : 'Cadastre seu rosto para usar o ponto facial. O processo leva menos de 10 segundos.'}
          </p>
          <button onClick={iniciarCamera} className="btn-primary flex items-center gap-2 mx-auto">
            <Camera size={16} />
            {perfilExistente ? 'Recadastrar Rosto' : 'Iniciar Cadastro'}
          </button>
        </div>
      )}

      {(etapa === 'camera' || etapa === 'detectando') && (
        <div className="space-y-3">
          <div className="relative rounded-xl overflow-hidden bg-black">
            <video ref={videoRef} className="w-full" autoPlay muted playsInline />
            {/* Guia oval */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-40 h-48 border-4 border-white/60 rounded-full" />
            </div>
          </div>
          {msg && <p className="text-sm text-center text-yellow-600">{msg}</p>}
          <div className="flex gap-2">
            <button
              onClick={() => { pararCamera(); setEtapa('aguardando'); setMsg(''); }}
              className="btn-secondary flex-1 text-sm"
            >
              Cancelar
            </button>
            <button
              onClick={capturarRosto}
              disabled={etapa === 'detectando' || salvando || !carregado}
              className="btn-primary flex-1 text-sm"
            >
              {etapa === 'detectando' ? 'Detectando...' : 'Capturar'}
            </button>
          </div>
        </div>
      )}

      {etapa === 'salvo' && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center py-4"
        >
          <CheckCircle size={48} className="text-success mx-auto mb-2" />
          <p className="font-semibold text-gray-800">Rosto cadastrado com sucesso!</p>
          <p className="text-sm text-gray-400 mt-1">Agora você pode usar o ponto facial.</p>
          <button onClick={() => setEtapa('aguardando')} className="btn-secondary mt-3 text-sm">
            Recadastrar
          </button>
        </motion.div>
      )}

      {etapa === 'erro' && (
        <div className="text-center py-4">
          <AlertCircle size={36} className="text-danger mx-auto mb-2" />
          <p className="text-sm text-gray-600">{msg}</p>
          <button onClick={() => setEtapa('aguardando')} className="btn-secondary mt-3 text-sm">
            Tentar novamente
          </button>
        </div>
      )}
    </div>
  );
}
