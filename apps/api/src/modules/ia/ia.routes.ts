import { Router, Response, NextFunction } from 'express';
import OpenAI from 'openai';
import { autenticar, AuthRequest } from '../../middlewares/auth.middleware';
import { validarTenant } from '../../middlewares/tenant.middleware';
import { env } from '../../config/env';
import prisma from '../../prisma/client';
import { z } from 'zod';
import * as ocorrenciasService from '../ocorrencias/ocorrencias.service';
import * as licencasService from '../licencas/licencas.service';
import * as vistoriasService from '../vistorias/vistorias.service';
import * as multasService from '../multas/multas.service';
import * as usuariosService from '../usuarios/usuarios.service';

const router = Router();
router.use(autenticar, validarTenant);

const client = new OpenAI({ apiKey: env.OPENAI_API_KEY });

// ─── FERRAMENTAS ──────────────────────────────────────────────────────────────

const FERRAMENTAS: OpenAI.Chat.ChatCompletionTool[] = [
  {
    type: 'function',
    function: {
      name: 'criar_ocorrencia',
      description: 'Cria uma nova ocorrência ambiental no sistema Goverde. Use quando o usuário pedir para registrar/abrir/criar uma ocorrência, denúncia ou caso ambiental.',
      parameters: {
        type: 'object',
        properties: {
          titulo: { type: 'string', description: 'Título objetivo da ocorrência' },
          descricao: { type: 'string', description: 'Descrição detalhada do problema' },
          categoria: {
            type: 'string',
            enum: ['DESMATAMENTO', 'QUEIMADA', 'RESIDUOS_ILEGAIS', 'POLUICAO_HIDRICA', 'POLUICAO_SONORA', 'FAUNA', 'OUTRO'],
          },
          prioridade: { type: 'string', enum: ['BAIXA', 'MEDIA', 'ALTA', 'CRITICA'] },
          endereco: { type: 'string' },
          bairro: { type: 'string' },
          nomeDenunciante: { type: 'string' },
          contatoDenunciante: { type: 'string' },
        },
        required: ['titulo', 'descricao', 'categoria'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'listar_ocorrencias',
      description: 'Lista ocorrências ambientais com filtros. Use quando o usuário quiser ver, consultar ou buscar ocorrências.',
      parameters: {
        type: 'object',
        properties: {
          status: { type: 'string', enum: ['ABERTA', 'EM_ANALISE', 'EM_CAMPO', 'RESOLVIDA', 'ARQUIVADA'] },
          categoria: { type: 'string', enum: ['DESMATAMENTO', 'QUEIMADA', 'RESIDUOS_ILEGAIS', 'POLUICAO_HIDRICA', 'POLUICAO_SONORA', 'FAUNA', 'OUTRO'] },
          prioridade: { type: 'string', enum: ['BAIXA', 'MEDIA', 'ALTA', 'CRITICA'] },
          bairro: { type: 'string' },
          limite: { type: 'number', description: 'Quantidade de resultados (padrão 5, máx 20)' },
        },
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'atualizar_status_ocorrencia',
      description: 'Atualiza o status de uma ocorrência existente. Use quando o usuário pedir para mudar/fechar/resolver/arquivar uma ocorrência.',
      parameters: {
        type: 'object',
        properties: {
          protocolo: { type: 'string', description: 'Protocolo da ocorrência (ex: OC-2026-00001)' },
          status: { type: 'string', enum: ['EM_ANALISE', 'EM_CAMPO', 'RESOLVIDA', 'ARQUIVADA'] },
          comentario: { type: 'string' },
        },
        required: ['protocolo', 'status'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'criar_licenca',
      description: 'Cria uma nova solicitação de licença ambiental.',
      parameters: {
        type: 'object',
        properties: {
          tipo: { type: 'string', enum: ['INSTALACAO', 'OPERACAO', 'LOCALIZACAO', 'SIMPLIFICADA'] },
          requerente: { type: 'string' },
          cpfCnpj: { type: 'string' },
          atividade: { type: 'string' },
          endereco: { type: 'string' },
        },
        required: ['tipo', 'requerente', 'cpfCnpj', 'atividade', 'endereco'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'listar_licencas',
      description: 'Lista licenças ambientais com filtros opcionais.',
      parameters: {
        type: 'object',
        properties: {
          status: { type: 'string', enum: ['SOLICITADA', 'EM_ANALISE', 'VISTORIA_AGENDADA', 'APROVADA', 'REPROVADA', 'CANCELADA', 'VENCIDA'] },
          limite: { type: 'number' },
        },
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'agendar_vistoria',
      description: 'Agenda uma vistoria no campo.',
      parameters: {
        type: 'object',
        properties: {
          dataAgendada: { type: 'string', description: 'Data e hora ISO (ex: 2026-04-15T09:00:00)' },
          observacoes: { type: 'string' },
          protocoloLicenca: { type: 'string', description: 'Protocolo da licença relacionada (opcional)' },
        },
        required: ['dataAgendada'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'emitir_auto_infracao',
      description: 'Emite um auto de infração ambiental (multa).',
      parameters: {
        type: 'object',
        properties: {
          autuadoNome: { type: 'string' },
          autuadoCpfCnpj: { type: 'string' },
          autuadoEndereco: { type: 'string' },
          descricao: { type: 'string' },
          artigos: { type: 'string' },
          valorMulta: { type: 'number' },
          dataInfracao: { type: 'string' },
          dataVencimento: { type: 'string' },
        },
        required: ['autuadoNome', 'autuadoCpfCnpj', 'autuadoEndereco', 'descricao', 'valorMulta', 'dataInfracao', 'dataVencimento'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'listar_usuarios',
      description: 'Lista os usuários/fiscais do sistema.',
      parameters: { type: 'object', properties: {} },
    },
  },
  {
    type: 'function',
    function: {
      name: 'resumo_dashboard',
      description: 'Busca o resumo estatístico atual: total de ocorrências, licenças, vistorias e multas.',
      parameters: { type: 'object', properties: {} },
    },
  },
];

// ─── EXECUTOR DE FERRAMENTAS ──────────────────────────────────────────────────

async function executarFerramenta(
  nome: string,
  input: Record<string, any>,
  usuarioId: string,
  tenantId: string
): Promise<{ sucesso: boolean; dados?: any; erro?: string }> {
  try {
    switch (nome) {
      case 'criar_ocorrencia': {
        const oc = await ocorrenciasService.criar(tenantId, usuarioId, {
          titulo: input.titulo,
          descricao: input.descricao,
          categoria: input.categoria,
          prioridade: input.prioridade ?? 'MEDIA',
          endereco: input.endereco,
          bairro: input.bairro,
          nomeDenunciante: input.nomeDenunciante,
          contatoDenunciante: input.contatoDenunciante,
        }, []);
        return { sucesso: true, dados: { protocolo: oc.protocolo, id: oc.id, titulo: oc.titulo, status: oc.status } };
      }

      case 'listar_ocorrencias': {
        const resultado = await ocorrenciasService.listar(tenantId, {
          status: input.status,
          categoria: input.categoria,
          prioridade: input.prioridade,
          bairro: input.bairro,
          limite: Math.min(input.limite ?? 5, 20),
        });
        return {
          sucesso: true,
          dados: {
            total: resultado.total,
            itens: resultado.data.map((o: any) => ({
              protocolo: o.protocolo,
              titulo: o.titulo,
              status: o.status,
              categoria: o.categoria,
              prioridade: o.prioridade,
              bairro: o.bairro,
              fiscal: o.fiscalResponsavel?.nome,
            })),
          },
        };
      }

      case 'atualizar_status_ocorrencia': {
        const ocorrencia = await prisma.ocorrencia.findFirst({
          where: { tenantId, protocolo: input.protocolo },
        });
        if (!ocorrencia) return { sucesso: false, erro: `Ocorrência ${input.protocolo} não encontrada` };
        await ocorrenciasService.atualizarStatus(tenantId, ocorrencia.id, usuarioId, {
          status: input.status,
          comentario: input.comentario,
          visivelCidadao: false,
        });
        return { sucesso: true, dados: { protocolo: input.protocolo, novoStatus: input.status } };
      }

      case 'criar_licenca': {
        const lic = await licencasService.criar(tenantId, {
          tipo: input.tipo,
          requerente: input.requerente,
          cpfCnpj: input.cpfCnpj,
          atividade: input.atividade,
          endereco: input.endereco,
        });
        return { sucesso: true, dados: { protocolo: lic.protocolo, id: lic.id, tipo: lic.tipo, status: lic.status } };
      }

      case 'listar_licencas': {
        const resultado = await licencasService.listar(tenantId, {
          status: input.status,
          limite: Math.min(input.limite ?? 5, 20),
        });
        return {
          sucesso: true,
          dados: {
            total: resultado.total,
            itens: resultado.data.map((l: any) => ({
              protocolo: l.protocolo,
              tipo: l.tipo,
              requerente: l.requerente,
              status: l.status,
            })),
          },
        };
      }

      case 'agendar_vistoria': {
        let licencaId: string | undefined;
        if (input.protocoloLicenca) {
          const lic = await prisma.licencaAmbiental.findFirst({
            where: { tenantId, protocolo: input.protocoloLicenca },
          });
          licencaId = lic?.id;
        }
        const vistoria = await vistoriasService.criar(tenantId, {
          fiscalId: usuarioId,
          dataAgendada: new Date(input.dataAgendada).toISOString(),
          observacoes: input.observacoes,
          licencaId,
        });
        return { sucesso: true, dados: { id: vistoria.id, dataAgendada: vistoria.dataAgendada, status: vistoria.status } };
      }

      case 'emitir_auto_infracao': {
        const multa = await multasService.emitirAutoInfracao(tenantId, usuarioId, {
          autuadoNome: input.autuadoNome,
          autuadoCpfCnpj: input.autuadoCpfCnpj,
          autuadoEndereco: input.autuadoEndereco,
          descricao: input.descricao,
          artigos: input.artigos,
          valorMulta: input.valorMulta,
          dataInfracao: new Date(input.dataInfracao),
          dataVencimento: new Date(input.dataVencimento),
        });
        return { sucesso: true, dados: { numero: multa.numero, id: multa.id, valorMulta: multa.valorMulta } };
      }

      case 'listar_usuarios': {
        const usuarios = await usuariosService.listar(tenantId);
        return {
          sucesso: true,
          dados: usuarios.map((u: any) => ({ id: u.id, nome: u.nome, papel: u.papel, ativo: u.ativo })),
        };
      }

      case 'resumo_dashboard': {
        const [ocTotal, ocAbertas, licTotal, licPendentes, vistoriasPendentes, multaTotal] = await Promise.all([
          prisma.ocorrencia.count({ where: { tenantId } }),
          prisma.ocorrencia.count({ where: { tenantId, status: { in: ['ABERTA', 'EM_ANALISE', 'EM_CAMPO'] } } }),
          prisma.licencaAmbiental.count({ where: { tenantId } }),
          prisma.licencaAmbiental.count({ where: { tenantId, status: { in: ['SOLICITADA', 'EM_ANALISE'] } } }),
          prisma.vistoria.count({ where: { tenantId, status: 'AGENDADA' } }),
          prisma.autoInfracao.count({ where: { tenantId } }),
        ]);
        return {
          sucesso: true,
          dados: {
            ocorrencias: { total: ocTotal, abertas: ocAbertas },
            licencas: { total: licTotal, pendentes: licPendentes },
            vistorias: { agendadas: vistoriasPendentes },
            multas: { total: multaTotal },
          },
        };
      }

      default:
        return { sucesso: false, erro: `Ferramenta '${nome}' não reconhecida` };
    }
  } catch (err: any) {
    return { sucesso: false, erro: err.message ?? 'Erro ao executar ação' };
  }
}

// ─── SCHEMA ───────────────────────────────────────────────────────────────────

const mensagensSchema = z.object({
  mensagens: z.array(
    z.object({
      role: z.enum(['user', 'assistant']),
      content: z.string().max(4000),
    })
  ).min(1).max(20),
  contexto: z.object({ tela: z.string().optional() }).optional(),
});

const SYSTEM_PROMPT = `Você é o **GoverdeAI**, assistente inteligente do sistema Goverde — plataforma de gestão ambiental municipal para prefeituras brasileiras.

Você pode **conversar** e também **executar ações reais no sistema** em nome do usuário.

**Capacidades:**
- Criar e consultar ocorrências ambientais
- Criar e consultar licenças ambientais
- Agendar vistorias
- Emitir autos de infração (multas ambientais)
- Listar usuários e fiscais
- Ver resumo do dashboard

**Como agir:**
- Quando o usuário pedir para fazer algo no sistema, use as ferramentas disponíveis
- Confirme o que foi feito e mostre o protocolo/número gerado
- Se faltar informação obrigatória, pergunte antes de executar
- Para datas sem ano, assuma o ano atual
- Responda sempre em português brasileiro
- Para consultas de legislação, cite artigos específicos (Lei 9.605/98, resoluções CONAMA, etc.)`;

// ─── ENDPOINT STREAMING COM FUNCTION CALLING ──────────────────────────────────

router.post('/agente', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    if (!env.OPENAI_API_KEY) {
      res.status(503).json({ message: 'IA não configurada. Adicione OPENAI_API_KEY no .env' });
      return;
    }

    const { mensagens, contexto } = mensagensSchema.parse(req.body);
    const { sub: usuarioId, tenantId } = req.usuario!;

    const [usuario, tenant] = await Promise.all([
      prisma.usuario.findUnique({ where: { id: usuarioId }, select: { nome: true, papel: true } }),
      prisma.tenant.findUnique({ where: { id: tenantId }, select: { nome: true, municipio: true, estado: true } }),
    ]);

    const systemComContexto = `${SYSTEM_PROMPT}

**Contexto:**
- Usuário: ${usuario?.nome ?? 'Usuário'} (${usuario?.papel ?? 'FISCAL'})
- Município: ${tenant?.municipio ?? ''} - ${tenant?.estado ?? ''} (${tenant?.nome ?? ''})
- Data atual: ${new Date().toLocaleDateString('pt-BR')}
${contexto?.tela ? `- Tela atual: ${contexto.tela}` : ''}`;

    // SSE headers
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();

    const emit = (data: object) => res.write(`data: ${JSON.stringify(data)}\n\n`);

    const conversaAtual: OpenAI.Chat.ChatCompletionMessageParam[] = [
      { role: 'system', content: systemComContexto },
      ...mensagens.map((m) => ({ role: m.role, content: m.content } as OpenAI.Chat.ChatCompletionMessageParam)),
    ];

    // Loop agentico — máx 5 rodadas de function calling
    for (let rodada = 0; rodada < 5; rodada++) {
      const response = await client.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: conversaAtual,
        tools: FERRAMENTAS,
        tool_choice: 'auto',
        max_tokens: 1500,
      });

      const choice = response.choices[0];
      const msg = choice.message;

      // Streaming simulado de texto
      if (msg.content) {
        const palavras = msg.content.split(/(?<=\s)/);
        for (const palavra of palavras) {
          emit({ tipo: 'delta', texto: palavra });
          await new Promise((r) => setTimeout(r, 8));
        }
      }

      // Sem chamadas de função — encerra
      if (choice.finish_reason !== 'tool_calls' || !msg.tool_calls?.length) {
        break;
      }

      // Adiciona mensagem do assistente com as tool_calls
      conversaAtual.push(msg);

      // Executa cada função
      for (const toolCall of msg.tool_calls) {
        const nome = toolCall.function.name;
        const input = JSON.parse(toolCall.function.arguments);

        emit({ tipo: 'acao_inicio', ferramenta: nome, input });

        const resultado = await executarFerramenta(nome, input, usuarioId, tenantId);

        emit({ tipo: 'acao_fim', ferramenta: nome, sucesso: resultado.sucesso, dados: resultado.dados, erro: resultado.erro });

        conversaAtual.push({
          role: 'tool',
          tool_call_id: toolCall.id,
          content: JSON.stringify(resultado),
        });
      }
    }

    emit({ tipo: 'fim' });
    res.end();
  } catch (err: any) {
    if (!res.headersSent) {
      next(err);
    } else {
      res.write(`data: ${JSON.stringify({ tipo: 'erro', mensagem: err.message ?? 'Erro interno' })}\n\n`);
      res.end();
    }
  }
});

// Endpoint simples sem streaming (compatibilidade)
router.post('/chat', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    if (!env.OPENAI_API_KEY) {
      return res.status(503).json({ message: 'IA não configurada.' });
    }
    const { mensagens } = mensagensSchema.parse(req.body);
    const response = await client.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        ...mensagens.map((m) => ({ role: m.role, content: m.content } as OpenAI.Chat.ChatCompletionMessageParam)),
      ],
      max_tokens: 1024,
    });
    res.json({ resposta: response.choices[0].message.content ?? '' });
  } catch (err) { next(err); }
});

export default router;
