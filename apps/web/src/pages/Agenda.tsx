import { useEffect, useState, useRef } from 'react';
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react';
import api from '../services/api';
import { cn } from '../utils/cn';

const MESES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
];
const DIAS_SEMANA = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

interface Vistoria {
  id: string;
  dataAgendada: string;
  status: string;
  fiscal: { nome: string };
  licenca: { protocolo: string; requerente: string } | null;
}

interface Licenca {
  id: string;
  protocolo: string;
  requerente: string;
  dataVencimento: string;
  status: string;
}

interface CalendarioEvento {
  id: string;
  tipo: 'vistoria' | 'licenca';
  titulo: string;
  detalhe: string;
  data: Date;
}

interface PopoverState {
  eventId: string;
  x: number;
  y: number;
}

function buildEventos(vistorias: Vistoria[], licencas: Licenca[]): CalendarioEvento[] {
  const eventos: CalendarioEvento[] = [];

  for (const v of vistorias) {
    eventos.push({
      id: `v-${v.id}`,
      tipo: 'vistoria',
      titulo: `Vistoria${v.licenca ? ` · ${v.licenca.protocolo}` : ''}`,
      detalhe: [
        v.licenca ? v.licenca.requerente : '',
        `Fiscal: ${v.fiscal.nome}`,
        `Status: ${v.status}`,
      ]
        .filter(Boolean)
        .join('\n'),
      data: new Date(v.dataAgendada),
    });
  }

  for (const l of licencas) {
    eventos.push({
      id: `l-${l.id}`,
      tipo: 'licenca',
      titulo: `Lic. vencendo · ${l.protocolo}`,
      detalhe: `${l.requerente}\nStatus: ${l.status}`,
      data: new Date(l.dataVencimento),
    });
  }

  return eventos;
}

function getDaysInMonth(ano: number, mes: number) {
  return new Date(ano, mes, 0).getDate();
}

function getFirstDayOfWeek(ano: number, mes: number) {
  return new Date(ano, mes - 1, 1).getDay();
}

export default function Agenda() {
  const agora = new Date();
  const [ano, setAno] = useState(agora.getFullYear());
  const [mes, setMes] = useState(agora.getMonth() + 1);
  const [vistorias, setVistorias] = useState<Vistoria[]>([]);
  const [licencas, setLicencas] = useState<Licenca[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [popover, setPopover] = useState<PopoverState | null>(null);
  const popoverRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setCarregando(true);
    Promise.all([
      api.get<Vistoria[]>('/api/vistorias'),
      api.get<Licenca[]>('/api/licencas/vencendo'),
    ])
      .then(([{ data: v }, { data: l }]) => {
        setVistorias(v);
        setLicencas(l);
      })
      .finally(() => setCarregando(false));
  }, []);

  // Close popover when clicking outside
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setPopover(null);
      }
    };
    if (popover) document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [popover]);

  const navMes = (delta: number) => {
    setPopover(null);
    let nm = mes + delta;
    let na = ano;
    if (nm > 12) { nm = 1; na++; }
    if (nm < 1) { nm = 12; na--; }
    setMes(nm);
    setAno(na);
  };

  const eventos = buildEventos(vistorias, licencas);

  const daysInMonth = getDaysInMonth(ano, mes);
  const firstDay = getFirstDayOfWeek(ano, mes);
  const totalCells = Math.ceil((firstDay + daysInMonth) / 7) * 7;

  const eventosDoMes = eventos.filter(
    (e) => e.data.getFullYear() === ano && e.data.getMonth() + 1 === mes
  );

  const eventosNoDia = (dia: number) =>
    eventosDoMes.filter((e) => e.data.getDate() === dia);

  const eventoById = (id: string) => eventos.find((e) => e.id === id);

  const handleEventoClick = (
    e: React.MouseEvent<HTMLButtonElement>,
    eventoId: string
  ) => {
    e.stopPropagation();
    if (popover?.eventId === eventoId) {
      setPopover(null);
      return;
    }
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    setPopover({
      eventId: eventoId,
      x: rect.left + window.scrollX,
      y: rect.bottom + window.scrollY + 6,
    });
  };

  const popoverEvento = popover ? eventoById(popover.eventId) : null;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-sora font-bold text-gray-800 text-xl">Agenda</h2>
        <p className="text-sm text-gray-400 mt-0.5">
          Vistorias agendadas e licenças próximas ao vencimento
        </p>
      </div>

      {/* Legenda */}
      <div className="flex items-center gap-4 flex-wrap">
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <span className="w-3 h-3 rounded bg-blue-500 inline-block" />
          Vistorias
        </div>
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <span className="w-3 h-3 rounded bg-orange-400 inline-block" />
          Licenças vencendo
        </div>
      </div>

      {/* Calendário */}
      <div className="card">
        {/* Navegação */}
        <div className="flex items-center justify-between mb-5">
          <button
            onClick={() => navMes(-1)}
            className="p-2 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-gray-700"
          >
            <ChevronLeft size={18} />
          </button>
          <div className="text-center">
            <h3 className="font-sora font-semibold text-gray-800">
              {MESES[mes - 1]} {ano}
            </h3>
            <p className="text-xs text-gray-400">{eventosDoMes.length} evento(s)</p>
          </div>
          <button
            onClick={() => navMes(1)}
            className="p-2 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-gray-700"
          >
            <ChevronRight size={18} />
          </button>
        </div>

        {carregando ? (
          <div className="flex justify-center py-16">
            <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full" />
          </div>
        ) : (
          <>
            {/* Dias da semana */}
            <div className="grid grid-cols-7 mb-1">
              {DIAS_SEMANA.map((d) => (
                <div
                  key={d}
                  className="text-center text-xs font-medium text-gray-400 py-2"
                >
                  {d}
                </div>
              ))}
            </div>

            {/* Grade de dias */}
            <div className="grid grid-cols-7 gap-px bg-gray-100 rounded-lg overflow-hidden border border-gray-100">
              {Array.from({ length: totalCells }).map((_, idx) => {
                const dia = idx - firstDay + 1;
                const valido = dia >= 1 && dia <= daysInMonth;
                const ehHoje =
                  valido &&
                  dia === agora.getDate() &&
                  mes === agora.getMonth() + 1 &&
                  ano === agora.getFullYear();
                const evs = valido ? eventosNoDia(dia) : [];

                return (
                  <div
                    key={idx}
                    className={cn(
                      'bg-white min-h-[80px] p-1.5 flex flex-col',
                      !valido && 'bg-gray-50'
                    )}
                  >
                    {valido && (
                      <>
                        <span
                          className={cn(
                            'text-xs font-medium w-6 h-6 flex items-center justify-center rounded-full mb-1 self-end',
                            ehHoje
                              ? 'bg-primary-500 text-white'
                              : 'text-gray-500'
                          )}
                        >
                          {dia}
                        </span>
                        <div className="flex flex-col gap-0.5 overflow-hidden">
                          {evs.map((ev) => (
                            <button
                              key={ev.id}
                              onClick={(e) => handleEventoClick(e, ev.id)}
                              className={cn(
                                'text-left text-xs px-1.5 py-0.5 rounded truncate w-full font-medium transition-opacity hover:opacity-80',
                                ev.tipo === 'vistoria'
                                  ? 'bg-blue-100 text-blue-700'
                                  : 'bg-orange-100 text-orange-700'
                              )}
                              title={ev.titulo}
                            >
                              {ev.titulo}
                            </button>
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>

      {/* Lista de eventos do mês */}
      {eventosDoMes.length > 0 && (
        <div className="card p-0 overflow-hidden">
          <div className="px-5 py-3 border-b border-gray-50">
            <h4 className="font-sora font-semibold text-gray-700 text-sm flex items-center gap-2">
              <Calendar size={15} />
              Eventos em {MESES[mes - 1]}
            </h4>
          </div>
          <ul className="divide-y divide-gray-50">
            {eventosDoMes
              .sort((a, b) => a.data.getTime() - b.data.getTime())
              .map((ev) => (
                <li key={ev.id} className="px-5 py-3 flex items-start gap-3 hover:bg-gray-50">
                  <span
                    className={cn(
                      'mt-0.5 w-2.5 h-2.5 rounded-full shrink-0',
                      ev.tipo === 'vistoria' ? 'bg-blue-500' : 'bg-orange-400'
                    )}
                  />
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-700 truncate">{ev.titulo}</p>
                    <p className="text-xs text-gray-400">
                      {ev.data.toLocaleDateString('pt-BR', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                      })}
                    </p>
                    <p className="text-xs text-gray-400 whitespace-pre-line mt-0.5">{ev.detalhe}</p>
                  </div>
                </li>
              ))}
          </ul>
        </div>
      )}

      {/* Popover */}
      {popover && popoverEvento && (
        <div
          ref={popoverRef}
          style={{ top: popover.y, left: popover.x }}
          className="fixed z-50 bg-white rounded-xl shadow-xl border border-gray-100 p-4 max-w-xs w-64"
        >
          <div className="flex items-start gap-2 mb-2">
            <span
              className={cn(
                'mt-1 w-2.5 h-2.5 rounded-full shrink-0',
                popoverEvento.tipo === 'vistoria' ? 'bg-blue-500' : 'bg-orange-400'
              )}
            />
            <p className="text-sm font-semibold text-gray-800 leading-tight">
              {popoverEvento.titulo}
            </p>
          </div>
          <p className="text-xs text-gray-500 whitespace-pre-line">{popoverEvento.detalhe}</p>
          <p className="text-xs text-gray-400 mt-2">
            {popoverEvento.data.toLocaleDateString('pt-BR', {
              weekday: 'long',
              day: '2-digit',
              month: 'long',
              year: 'numeric',
            })}
          </p>
        </div>
      )}
    </div>
  );
}
