import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bot, X, Send, Loader2, ChevronDown, Sparkles, User,
  CheckCircle, AlertCircle, Zap,
} from 'lucide-react';
import { useLocation } from 'react-router-dom';
import api from '../../services/api';
import ReactMarkdown from 'react-markdown';

// ─── TIPOS ────────────────────────────────────────────────────────────────────

interface AcaoInfo {
  ferramenta: string;
  input?: Record<string, any>;
  sucesso?: boolean;
  dados?: any;
  erro?: string;
  status: 'executando' | 'concluida' | 'erro';
}

interface Mensagem {
  role: 'user' | 'assistant';
  content: string;
  carregando?: boolean;
  acoes?: AcaoInfo[];
}

// ─── HELPERS ──────────────────────────────────────────────────────────────────

const FERRAMENTA_LABELS: Record<string, string> = {
  criar_ocorrencia: 'Criando ocorrência',
  listar_ocorrencias: 'Buscando ocorrências',
  atualizar_status_ocorrencia: 'Atualizando status',
  criar_licenca: 'Criando licença',
  listar_licencas: 'Buscando licenças',
  agendar_vistoria: 'Agendando vistoria',
  emitir_auto_infracao: 'Emitindo auto de infração',
  listar_usuarios: 'Buscando usuários',
  resumo_dashboard: 'Consultando dashboard',
};

function labelFerramenta(nome: string) {
  return FERRAMENTA_LABELS[nome] ?? nome;
}

const SUGESTOES = [
  'Crie uma ocorrência de desmatamento na Rua das Flores',
  'Liste as ocorrências abertas de hoje',
  'Quais licenças estão pendentes?',
  'Agende uma vistoria para amanhã às 9h',
  'Emita um auto de infração por queimada ilegal',
];

const TELA_LABELS: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/ocorrencias': 'Ocorrências',
  '/licencas': 'Licenciamento',
  '/vistorias': 'Vistorias',
  '/ponto': 'Ponto Eletrônico',
  '/multas': 'Auto de Infração',
  '/usuarios': 'Usuários',
};

// ─── COMPONENTE DE AÇÃO ───────────────────────────────────────────────────────

function BlocoAcao({ acao }: { acao: AcaoInfo }) {
  const [expandido, setExpandido] = useState(false);

  return (
    <div
      className={`rounded-lg border text-xs px-3 py-2 my-1 cursor-pointer select-none transition-colors ${
        acao.status === 'executando'
          ? 'border-blue-200 bg-blue-50 text-blue-700'
          : acao.status === 'erro'
          ? 'border-red-200 bg-red-50 text-red-600'
          : 'border-green-200 bg-green-50 text-green-700'
      }`}
      onClick={() => setExpandido(!expandido)}
    >
      <div className="flex items-center gap-2">
        {acao.status === 'executando' && <Loader2 size={12} className="animate-spin shrink-0" />}
        {acao.status === 'concluida' && <CheckCircle size={12} className="shrink-0" />}
        {acao.status === 'erro' && <AlertCircle size={12} className="shrink-0" />}
        <span className="font-medium">{labelFerramenta(acao.ferramenta)}</span>
        {acao.status === 'concluida' && <span className="ml-auto text-[10px] opacity-60">ver detalhes</span>}
      </div>

      {expandido && acao.dados && (
        <pre className="mt-2 text-[10px] opacity-80 whitespace-pre-wrap break-all">
          {JSON.stringify(acao.dados, null, 2)}
        </pre>
      )}
      {expandido && acao.erro && (
        <p className="mt-1 text-[10px]">{acao.erro}</p>
      )}
    </div>
  );
}

// ─── CHAT PRINCIPAL ───────────────────────────────────────────────────────────

export default function ChatIA() {
  const [aberto, setAberto] = useState(false);
  const [minimizado, setMinimizado] = useState(false);
  const [mensagens, setMensagens] = useState<Mensagem[]>([]);
  const [input, setInput] = useState('');
  const [enviando, setEnviando] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const location = useLocation();

  const tela = TELA_LABELS[location.pathname] ?? '';

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [mensagens]);

  useEffect(() => {
    if (aberto && !minimizado) setTimeout(() => inputRef.current?.focus(), 100);
  }, [aberto, minimizado]);

  const enviar = async (texto?: string) => {
    const msg = texto ?? input.trim();
    if (!msg || enviando) return;
    setInput('');

    setMensagens((prev) => [
      ...prev,
      { role: 'user', content: msg },
      { role: 'assistant', content: '', carregando: true, acoes: [] },
    ]);
    setEnviando(true);

    const historico = [...mensagens, { role: 'user' as const, content: msg }]
      .slice(-10)
      .map(({ role, content }) => ({ role, content }));

    try {
      const token = localStorage.getItem('accessToken');
      const baseURL = api.defaults.baseURL ?? '';

      const res = await fetch(`${baseURL}/api/ia/agente`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        credentials: 'include',
        body: JSON.stringify({ mensagens: historico, contexto: { tela } }),
      });

      if (!res.ok || !res.body) throw new Error('Falha na requisição');

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let textoAcumulado = '';
      let acoesAtivas: AcaoInfo[] = [];

      const atualizar = (texto: string, acoes: AcaoInfo[]) => {
        setMensagens((prev) => {
          const copia = [...prev];
          copia[copia.length - 1] = {
            role: 'assistant',
            content: texto,
            acoes: [...acoes],
          };
          return copia;
        });
      };

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value);

        for (const linha of chunk.split('\n')) {
          if (!linha.startsWith('data: ')) continue;
          try {
            const evento = JSON.parse(linha.slice(6));

            if (evento.tipo === 'delta') {
              textoAcumulado += evento.texto;
              atualizar(textoAcumulado, acoesAtivas);

            } else if (evento.tipo === 'acao_inicio') {
              acoesAtivas = [...acoesAtivas, {
                ferramenta: evento.ferramenta,
                input: evento.input,
                status: 'executando',
              }];
              atualizar(textoAcumulado, acoesAtivas);

            } else if (evento.tipo === 'acao_fim') {
              acoesAtivas = acoesAtivas.map((a) =>
                a.ferramenta === evento.ferramenta && a.status === 'executando'
                  ? {
                      ...a,
                      sucesso: evento.sucesso,
                      dados: evento.dados,
                      erro: evento.erro,
                      status: evento.sucesso ? 'concluida' : 'erro',
                    }
                  : a
              );
              atualizar(textoAcumulado, acoesAtivas);

            } else if (evento.tipo === 'fim' || evento.tipo === 'erro') {
              break;
            }
          } catch {}
        }
      }
    } catch {
      setMensagens((prev) => {
        const copia = [...prev];
        copia[copia.length - 1] = {
          role: 'assistant',
          content: 'Não consegui processar sua solicitação. Verifique se a chave ANTHROPIC_API_KEY está configurada no servidor.',
          acoes: [],
        };
        return copia;
      });
    } finally {
      setEnviando(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      enviar();
    }
  };

  return (
    <>
      {/* Botão flutuante */}
      <AnimatePresence>
        {!aberto && (
          <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            onClick={() => { setAberto(true); setMinimizado(false); }}
            className="fixed bottom-6 right-6 z-40 w-14 h-14 bg-primary-500 text-white rounded-full shadow-lg flex items-center justify-center hover:bg-primary-600 transition-colors group"
            title="GoverdeAI"
          >
            <Sparkles size={22} />
            <span className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full border-2 border-white" />
          </motion.button>
        )}
      </AnimatePresence>

      {/* Painel */}
      <AnimatePresence>
        {aberto && (
          <motion.div
            initial={{ opacity: 0, y: 40, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 40, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="fixed bottom-6 right-6 z-50 w-[400px] max-w-[calc(100vw-2rem)] flex flex-col shadow-2xl rounded-2xl overflow-hidden border border-gray-200 bg-white"
            style={{ maxHeight: minimizado ? 'auto' : '640px' }}
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-primary-600 to-primary-500 text-white px-4 py-3 flex items-center gap-3 shrink-0">
              <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center relative">
                <Bot size={16} />
                <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-green-400 rounded-full border border-white" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <p className="font-semibold text-sm leading-none">GoverdeAI</p>
                  <span className="flex items-center gap-0.5 text-[10px] bg-white/20 px-1.5 py-0.5 rounded-full">
                    <Zap size={9} /> Agente
                  </span>
                </div>
                <p className="text-xs text-primary-200 mt-0.5 truncate">
                  {tela || 'Assistente ambiental inteligente'}
                </p>
              </div>
              <div className="flex items-center gap-1">
                {mensagens.length > 0 && (
                  <button
                    onClick={() => setMensagens([])}
                    className="text-white/60 hover:text-white text-xs px-2 py-1 rounded transition-colors"
                  >
                    Limpar
                  </button>
                )}
                <button onClick={() => setMinimizado(!minimizado)} className="p-1.5 rounded-lg hover:bg-white/20 transition-colors">
                  <ChevronDown size={16} className={`transition-transform ${minimizado ? 'rotate-180' : ''}`} />
                </button>
                <button onClick={() => setAberto(false)} className="p-1.5 rounded-lg hover:bg-white/20 transition-colors">
                  <X size={16} />
                </button>
              </div>
            </div>

            <AnimatePresence>
              {!minimizado && (
                <motion.div
                  initial={{ height: 0 }}
                  animate={{ height: 'auto' }}
                  exit={{ height: 0 }}
                  className="flex flex-col flex-1 overflow-hidden"
                  style={{ maxHeight: '580px' }}
                >
                  {/* Mensagens */}
                  <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-[300px]">
                    {mensagens.length === 0 ? (
                      <div className="text-center py-2">
                        <div className="w-14 h-14 bg-gradient-to-br from-primary-100 to-primary-50 rounded-2xl flex items-center justify-center mx-auto mb-3">
                          <Sparkles size={26} className="text-primary" />
                        </div>
                        <p className="text-sm font-semibold text-gray-800">Olá! Sou o GoverdeAI</p>
                        <p className="text-xs text-gray-400 mt-1 mb-4 leading-relaxed">
                          Posso conversar, responder dúvidas e<br />
                          <strong className="text-gray-500">executar ações no sistema</strong> por você.
                        </p>
                        <div className="space-y-2 text-left">
                          {SUGESTOES.map((s) => (
                            <button
                              key={s}
                              onClick={() => enviar(s)}
                              className="w-full text-left text-xs bg-gray-50 hover:bg-primary-50 hover:text-primary border border-gray-100 hover:border-primary-200 rounded-xl px-3 py-2.5 transition-colors leading-relaxed"
                            >
                              {s}
                            </button>
                          ))}
                        </div>
                      </div>
                    ) : (
                      mensagens.map((m, i) => (
                        <div key={i} className={`flex gap-2 ${m.role === 'user' ? 'flex-row-reverse' : ''}`}>
                          <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${m.role === 'user' ? 'bg-primary-100' : 'bg-primary-500'}`}>
                            {m.role === 'user'
                              ? <User size={13} className="text-primary" />
                              : <Bot size={13} className="text-white" />
                            }
                          </div>

                          <div className={`max-w-[85%] space-y-1 ${m.role === 'user' ? 'items-end flex flex-col' : ''}`}>
                            {/* Ações executadas */}
                            {m.acoes && m.acoes.length > 0 && (
                              <div className="w-full">
                                {m.acoes.map((acao, ai) => (
                                  <BlocoAcao key={ai} acao={acao} />
                                ))}
                              </div>
                            )}

                            {/* Texto da mensagem */}
                            {(m.content || m.carregando) && (
                              <div className={`inline-block rounded-2xl px-3 py-2 text-sm ${
                                m.role === 'user'
                                  ? 'bg-primary-500 text-white rounded-tr-sm'
                                  : 'bg-gray-100 text-gray-800 rounded-tl-sm'
                              }`}>
                                {m.carregando && !m.content && !m.acoes?.length ? (
                                  <div className="flex items-center gap-1.5">
                                    <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                                    <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                                    <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                                  </div>
                                ) : m.role === 'assistant' ? (
                                  <div className="prose prose-sm max-w-none text-gray-800 [&>p]:mb-1 [&>ul]:mb-1 [&>ol]:mb-1">
                                    <ReactMarkdown>{m.content}</ReactMarkdown>
                                  </div>
                                ) : (
                                  <span className="whitespace-pre-wrap">{m.content}</span>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      ))
                    )}
                    <div ref={bottomRef} />
                  </div>

                  {/* Input */}
                  <div className="border-t border-gray-100 p-3 shrink-0 bg-white">
                    <div className="flex gap-2 items-end">
                      <textarea
                        ref={inputRef}
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Pergunte ou peça uma ação..."
                        rows={1}
                        disabled={enviando}
                        className="flex-1 resize-none rounded-xl border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:border-primary-400 focus:ring-1 focus:ring-primary-200 disabled:opacity-50 max-h-28 overflow-y-auto"
                        style={{ minHeight: '40px' }}
                        onInput={(e) => {
                          const el = e.currentTarget;
                          el.style.height = 'auto';
                          el.style.height = Math.min(el.scrollHeight, 112) + 'px';
                        }}
                      />
                      <button
                        onClick={() => enviar()}
                        disabled={!input.trim() || enviando}
                        className="w-9 h-9 bg-primary-500 text-white rounded-xl flex items-center justify-center hover:bg-primary-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors shrink-0"
                      >
                        {enviando ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />}
                      </button>
                    </div>
                    <p className="text-[10px] text-gray-300 text-center mt-1.5">
                      GoverdeAI pode criar e consultar dados reais · Powered by Claude
                    </p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
