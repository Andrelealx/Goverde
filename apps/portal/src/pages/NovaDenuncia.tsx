import { useState, useRef } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import {
  ArrowLeft, ArrowRight, Upload, X, CheckCircle,
  MapPin, Loader2, Camera, Copy, Check, TreePine,
  Flame, Trash2, Droplets, Volume2, Bird, HelpCircle,
} from 'lucide-react';
import Header from '../components/Header';

const TENANT_SLUG = import.meta.env.VITE_TENANT_SLUG ?? 'guapimirim';
const API_URL = import.meta.env.VITE_API_URL ?? '';

const categorias = [
  { valor: 'DESMATAMENTO', label: 'Desmatamento', icon: TreePine, desc: 'Corte ilegal de árvores ou supressão de vegetação', cor: 'text-green-600 bg-green-50 border-green-200' },
  { valor: 'QUEIMADA', label: 'Queimada', icon: Flame, desc: 'Incêndio ou queimada em área de vegetação', cor: 'text-orange-500 bg-orange-50 border-orange-200' },
  { valor: 'RESIDUOS_ILEGAIS', label: 'Resíduos Ilegais', icon: Trash2, desc: 'Descarte ou depósito irregular de lixo e entulho', cor: 'text-yellow-600 bg-yellow-50 border-yellow-200' },
  { valor: 'POLUICAO_HIDRICA', label: 'Poluição Hídrica', icon: Droplets, desc: 'Contaminação de rios, lagos ou lençol freático', cor: 'text-blue-500 bg-blue-50 border-blue-200' },
  { valor: 'POLUICAO_SONORA', label: 'Poluição Sonora', icon: Volume2, desc: 'Ruído excessivo causando perturbação', cor: 'text-purple-500 bg-purple-50 border-purple-200' },
  { valor: 'FAUNA', label: 'Fauna', icon: Bird, desc: 'Maus-tratos, captura ou tráfico de animais', cor: 'text-teal-500 bg-teal-50 border-teal-200' },
  { valor: 'OUTRO', label: 'Outro', icon: HelpCircle, desc: 'Outro tipo de problema ambiental', cor: 'text-gray-500 bg-gray-50 border-gray-200' },
];

interface FormData {
  categoria: string; titulo: string; descricao: string;
  endereco: string; bairro: string;
  latitude?: number; longitude?: number;
  nomeDenunciante: string; contatoDenunciante: string; anonimo: boolean;
}

export default function NovaDenuncia() {
  const [searchParams] = useSearchParams();
  const categoriaInicial = searchParams.get('categoria') ?? '';
  const [etapa, setEtapa] = useState(categoriaInicial ? 2 : 1);
  const [form, setForm] = useState<FormData>({ categoria: categoriaInicial, titulo: '', descricao: '', endereco: '', bairro: '', nomeDenunciante: '', contatoDenunciante: '', anonimo: false });
  const [fotos, setFotos] = useState<File[]>([]);
  const [protocolo, setProtocolo] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState('');
  const [obtendoGeo, setObtendoGeo] = useState(false);
  const [geoObtida, setGeoObtida] = useState(false);
  const [copiado, setCopiado] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const setField = (field: keyof FormData) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((p) => ({ ...p, [field]: e.target.value }));

  const obterLocalizacao = () => {
    if (!navigator.geolocation) return;
    setObtendoGeo(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => { setForm((p) => ({ ...p, latitude: pos.coords.latitude, longitude: pos.coords.longitude })); setGeoObtida(true); setObtendoGeo(false); },
      () => setObtendoGeo(false),
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const handleFotos = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    setFotos((p) => [...p, ...files].slice(0, 5));
  };

  const copiarProtocolo = () => {
    navigator.clipboard.writeText(protocolo);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2000);
  };

  const enviar = async () => {
    setEnviando(true); setErro('');
    try {
      const fd = new FormData();
      fd.append('dados', JSON.stringify({
        titulo: form.titulo, descricao: form.descricao, categoria: form.categoria,
        endereco: form.endereco || undefined, bairro: form.bairro || undefined,
        latitude: form.latitude, longitude: form.longitude,
        nomeDenunciante: form.anonimo ? undefined : (form.nomeDenunciante || undefined),
        contatoDenunciante: form.anonimo ? undefined : (form.contatoDenunciante || undefined),
      }));
      fotos.forEach((f) => fd.append('fotos', f));
      const { data } = await axios.post(`${API_URL}/api/public/${TENANT_SLUG}/ocorrencias`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      setProtocolo(data.protocolo);
      setEtapa(6);
    } catch (err: any) {
      setErro(err.response?.data?.message ?? 'Erro ao enviar. Tente novamente.');
    } finally { setEnviando(false); }
  };

  const steps = ['Categoria', 'Detalhes', 'Local', 'Fotos', 'Dados'];
  const catSel = categorias.find((c) => c.valor === form.categoria);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header />
      <main className="flex-1 max-w-2xl mx-auto w-full px-4 py-8">
        {etapa < 6 && (
          <div className="mb-8 flex items-center justify-between">
            {steps.map((label, i) => {
              const num = i + 1; const ativo = etapa === num; const ok = etapa > num;
              return (
                <div key={num} className="flex items-center flex-1">
                  <div className="flex flex-col items-center">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${ok ? 'bg-primary-500 text-white' : ativo ? 'bg-primary-500 text-white ring-4 ring-primary-100' : 'bg-gray-200 text-gray-400'}`}>
                      {ok ? <Check size={14} /> : num}
                    </div>
                    <span className={`text-[10px] mt-1 hidden sm:block font-medium ${ativo ? 'text-primary-600' : 'text-gray-400'}`}>{label}</span>
                  </div>
                  {i < steps.length - 1 && <div className={`flex-1 h-0.5 mx-1 ${ok ? 'bg-primary-500' : 'bg-gray-200'}`} />}
                </div>
              );
            })}
          </div>
        )}

        <AnimatePresence mode="wait">
          {etapa === 1 && (
            <motion.div key="e1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-5">
              <div>
                <h2 className="font-sora font-bold text-xl text-gray-800">Qual o tipo de problema?</h2>
                <p className="text-gray-400 text-sm mt-1">Escolha a categoria que melhor descreve o problema</p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {categorias.map(({ valor, label, icon: Icon, desc, cor }) => (
                  <button key={valor} onClick={() => { setForm((p) => ({ ...p, categoria: valor })); setEtapa(2); }}
                    className={`flex items-start gap-3 p-4 rounded-2xl border-2 text-left transition-all hover:shadow-md ${form.categoria === valor ? 'border-primary-500 bg-primary-50' : 'border-gray-100 bg-white hover:border-primary-200'}`}>
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border ${cor}`}><Icon size={20} /></div>
                    <div><p className="font-semibold text-sm text-gray-800">{label}</p><p className="text-xs text-gray-400 mt-0.5 leading-relaxed">{desc}</p></div>
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          {etapa === 2 && (
            <motion.div key="e2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-5">
              <div className="flex items-center gap-3">
                {catSel && <div className={`w-10 h-10 rounded-xl flex items-center justify-center border ${catSel.cor} shrink-0`}><catSel.icon size={20} /></div>}
                <div><h2 className="font-sora font-bold text-xl text-gray-800">Descreva o problema</h2><p className="text-gray-400 text-sm">{catSel?.label}</p></div>
              </div>
              <div className="bg-white rounded-2xl border border-gray-100 p-5 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Título *</label>
                  <input className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary-300 focus:border-primary-400 outline-none" value={form.titulo} onChange={setField('titulo')} placeholder="Ex: Descarte ilegal de entulho na beira do rio" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Descrição *</label>
                  <textarea rows={4} className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary-300 outline-none resize-none" value={form.descricao} onChange={setField('descricao')} placeholder="Descreva com o máximo de detalhes..." />
                </div>
              </div>
              <div className="flex gap-3">
                <button onClick={() => setEtapa(1)} className="flex-1 py-3 border border-gray-200 rounded-2xl text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"><ArrowLeft size={15} className="inline mr-1" />Voltar</button>
                <button onClick={() => setEtapa(3)} disabled={!form.titulo.trim() || !form.descricao.trim()} className="flex-1 py-3 bg-primary-500 text-white rounded-2xl text-sm font-medium disabled:opacity-40 hover:bg-primary-600 transition-colors">Próximo <ArrowRight size={15} className="inline ml-1" /></button>
              </div>
            </motion.div>
          )}

          {etapa === 3 && (
            <motion.div key="e3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-5">
              <div>
                <h2 className="font-sora font-bold text-xl text-gray-800">Onde aconteceu?</h2>
                <p className="text-gray-400 text-sm mt-1">Informe o local para que nossa equipe possa atender</p>
              </div>
              <div className="bg-white rounded-2xl border border-gray-100 p-5 space-y-4">
                <button onClick={obterLocalizacao} disabled={obtendoGeo}
                  className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl border-2 text-sm font-medium transition-all ${geoObtida ? 'border-green-300 bg-green-50 text-green-700' : 'border-primary-200 bg-primary-50 text-primary-600 hover:bg-primary-100'}`}>
                  {obtendoGeo ? <><Loader2 size={15} className="animate-spin" />Obtendo...</> : geoObtida ? <><CheckCircle size={15} />GPS obtido ✅</> : <><MapPin size={15} />Usar minha localização atual</>}
                </button>
                {geoObtida && <p className="text-xs text-center text-gray-400">📍 {form.latitude?.toFixed(5)}, {form.longitude?.toFixed(5)}</p>}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1.5">Bairro</label>
                    <input className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary-300" value={form.bairro} onChange={setField('bairro')} placeholder="Nome do bairro" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1.5">Endereço / Referência</label>
                    <input className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary-300" value={form.endereco} onChange={setField('endereco')} placeholder="Rua, nº ou referência" />
                  </div>
                </div>
              </div>
              <div className="flex gap-3">
                <button onClick={() => setEtapa(2)} className="flex-1 py-3 border border-gray-200 rounded-2xl text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"><ArrowLeft size={15} className="inline mr-1" />Voltar</button>
                <button onClick={() => setEtapa(4)} className="flex-1 py-3 bg-primary-500 text-white rounded-2xl text-sm font-medium hover:bg-primary-600 transition-colors">Próximo <ArrowRight size={15} className="inline ml-1" /></button>
              </div>
            </motion.div>
          )}

          {etapa === 4 && (
            <motion.div key="e4" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-5">
              <div>
                <h2 className="font-sora font-bold text-xl text-gray-800">Adicionar fotos</h2>
                <p className="text-gray-400 text-sm mt-1">Opcional, mas muito útil. Até 5 fotos.</p>
              </div>
              <div className="bg-white rounded-2xl border border-gray-100 p-5 space-y-4">
                <input ref={fileRef} type="file" accept="image/*" multiple onChange={handleFotos} className="hidden" />
                <button onClick={() => fileRef.current?.click()}
                  className="w-full flex flex-col items-center gap-3 py-10 border-2 border-dashed border-gray-200 rounded-2xl hover:border-primary-300 hover:bg-primary-50 transition-all group">
                  <div className="w-12 h-12 bg-gray-100 group-hover:bg-primary-100 rounded-2xl flex items-center justify-center transition-colors">
                    <Camera size={22} className="text-gray-400 group-hover:text-primary-500" />
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-medium text-gray-600 group-hover:text-primary-600">Clique ou arraste fotos aqui</p>
                    <p className="text-xs text-gray-400 mt-0.5">JPG, PNG · Máx. 10MB cada</p>
                  </div>
                </button>
                {fotos.length > 0 && (
                  <div className="grid grid-cols-5 gap-2">
                    {fotos.map((f, i) => (
                      <div key={i} className="relative aspect-square">
                        <img src={URL.createObjectURL(f)} className="w-full h-full object-cover rounded-xl" alt="" />
                        <button onClick={() => setFotos((p) => p.filter((_, j) => j !== i))} className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center shadow">
                          <X size={10} className="text-white" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div className="flex gap-3">
                <button onClick={() => setEtapa(3)} className="flex-1 py-3 border border-gray-200 rounded-2xl text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"><ArrowLeft size={15} className="inline mr-1" />Voltar</button>
                <button onClick={() => setEtapa(5)} className="flex-1 py-3 bg-primary-500 text-white rounded-2xl text-sm font-medium hover:bg-primary-600 transition-colors">Próximo <ArrowRight size={15} className="inline ml-1" /></button>
              </div>
            </motion.div>
          )}

          {etapa === 5 && (
            <motion.div key="e5" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-5">
              <div>
                <h2 className="font-sora font-bold text-xl text-gray-800">Seus dados</h2>
                <p className="text-gray-400 text-sm mt-1">Opcional. Para contato em caso de necessidade.</p>
              </div>
              <div className="bg-white rounded-2xl border border-gray-100 p-5 space-y-4">
                <div className="flex items-center justify-between py-2 border-b border-gray-100 cursor-pointer" onClick={() => setForm((p) => ({ ...p, anonimo: !p.anonimo }))}>
                  <div>
                    <p className="text-sm font-medium text-gray-700">Denúncia anônima</p>
                    <p className="text-xs text-gray-400">Seus dados não serão informados</p>
                  </div>
                  <div className={`w-11 h-6 rounded-full transition-colors relative ${form.anonimo ? 'bg-primary-500' : 'bg-gray-200'}`}>
                    <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${form.anonimo ? 'translate-x-5' : 'translate-x-0.5'}`} />
                  </div>
                </div>
                {!form.anonimo && (
                  <>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1.5">Seu nome</label>
                      <input className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary-300" value={form.nomeDenunciante} onChange={setField('nomeDenunciante')} placeholder="Nome completo" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1.5">Telefone ou e-mail</label>
                      <input className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary-300" value={form.contatoDenunciante} onChange={setField('contatoDenunciante')} placeholder="(21) 99999-9999 ou email@exemplo.com" />
                    </div>
                  </>
                )}
              </div>
              <div className="bg-primary-50 rounded-2xl p-4 text-sm space-y-1 border border-primary-100">
                <p className="font-semibold text-primary-700 mb-2 text-xs uppercase tracking-wide">Resumo</p>
                <p className="text-gray-600"><span className="text-gray-400">Categoria:</span> {catSel?.label}</p>
                <p className="text-gray-600"><span className="text-gray-400">Título:</span> {form.titulo}</p>
                {form.bairro && <p className="text-gray-600"><span className="text-gray-400">Bairro:</span> {form.bairro}</p>}
                {geoObtida && <p className="text-gray-600"><span className="text-gray-400">GPS:</span> ✅ Coletado</p>}
                {fotos.length > 0 && <p className="text-gray-600"><span className="text-gray-400">Fotos:</span> {fotos.length}</p>}
              </div>
              {erro && <div className="bg-red-50 border border-red-200 rounded-2xl px-4 py-3 text-sm text-red-600">{erro}</div>}
              <div className="flex gap-3">
                <button onClick={() => setEtapa(4)} className="flex-1 py-3 border border-gray-200 rounded-2xl text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"><ArrowLeft size={15} className="inline mr-1" />Voltar</button>
                <button onClick={enviar} disabled={enviando} className="flex-1 py-3 bg-primary-500 text-white rounded-2xl text-sm font-semibold hover:bg-primary-600 transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
                  {enviando ? <><Loader2 size={15} className="animate-spin" />Enviando...</> : 'Enviar Denúncia'}
                </button>
              </div>
            </motion.div>
          )}

          {etapa === 6 && (
            <motion.div key="e6" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="text-center space-y-6 py-6">
              <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', delay: 0.1 }} className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle size={44} className="text-green-500" />
              </motion.div>
              <div>
                <h2 className="font-sora font-bold text-2xl text-gray-800">Denúncia registrada!</h2>
                <p className="text-gray-400 mt-2 text-sm">Nossa equipe irá analisar e tomar as providências.</p>
              </div>
              <div className="bg-primary-50 border-2 border-primary-200 rounded-3xl px-8 py-6">
                <p className="text-xs text-gray-500 mb-1 uppercase tracking-widest font-medium">Protocolo</p>
                <p className="font-mono font-bold text-2xl text-primary-600 tracking-widest">{protocolo}</p>
                <button onClick={copiarProtocolo} className="mt-3 flex items-center gap-1.5 text-xs text-primary-500 hover:text-primary-700 mx-auto transition-colors">
                  {copiado ? <><Check size={12} />Copiado!</> : <><Copy size={12} />Copiar protocolo</>}
                </button>
              </div>
              <p className="text-sm text-gray-500 max-w-xs mx-auto">Use esse número para acompanhar o andamento em <strong>Consultar Protocolo</strong>.</p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Link to="/protocolo" className="flex items-center justify-center gap-2 px-6 py-3 bg-primary-500 text-white rounded-2xl font-medium text-sm hover:bg-primary-600 transition-colors">
                  <MapPin size={15} /> Consultar Status
                </Link>
                <Link to="/" className="flex items-center justify-center gap-2 px-6 py-3 border border-gray-200 rounded-2xl font-medium text-sm text-gray-600 hover:bg-gray-50 transition-colors">
                  Voltar ao início
                </Link>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
