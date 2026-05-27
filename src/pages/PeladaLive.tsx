import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { 
  Play, 
  Pause, 
  RotateCcw, 
  Plus, 
  UserMinus, 
  UserPlus, 
  Timer,
  ChevronLeft,
  Loader2,
  Trophy,
  History,
  Info,
  MoreVertical,
  X,
  Users,
  Handshake
} from "lucide-react";
import { toast } from "react-hot-toast";
import api from "../services/api";
import { cn } from "../lib/utils";
import { useAuth } from "../context/AuthContext";
import io from "../services/socket";
import DataService, { Pelada, Time, Evento, COLETE_COLORS, getColeteStyle } from "../services/dataService";
const socket = io;

const PeladaLive = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [pelada, setPelada] = useState<any>(null);
  const [times, setTimes] = useState<Time[]>([]);
  const [score, setScore] = useState({ casa: 0, visitante: 0 });
  const [seconds, setSeconds] = useState(0);
  const [isActive, setIsActive] = useState(false);
  const [eventos, setEventos] = useState<Evento[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const [showSummaryModal, setShowSummaryModal] = useState(false);

  const isOrganizador = true; // Full local mode priority

  useEffect(() => {
    fetchData();

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "peladas") {
        fetchData();
      }
    };

    window.addEventListener('storage', handleStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [id]);

  useEffect(() => {
    if (isActive) {
      timerRef.current = setInterval(() => {
        setSeconds((s) => s + 1);
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isActive]);

  const fetchData = () => {
    if (!id) return;
    try {
      const found = DataService.getPeladaById(id);
      if (found) {
        setPelada(found);
        setTimes(found.times || []);
        setScore({ casa: found.placar_casa || 0, visitante: found.placar_visitante || 0 });
        setSeconds(found.cronometro_segundos || 0);
        setIsActive(found.cronometro_ativo || false);
        setEventos(found.eventos || []);
      }
    } catch (error) {
      console.warn("Live fetch error", error);
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const toggleTimer = () => {
    if (!id) return;
    const nextState = !isActive;
    setIsActive(nextState);
    
    // Save locally
    DataService.updateMatch(id, { cronometro_ativo: nextState, cronometro_segundos: seconds });
  };

  const resetTimer = () => {
    if (!id) return;
    setIsActive(false);
    setSeconds(0);
    
    // Save locally
    DataService.updateMatch(id, { cronometro_ativo: false, cronometro_segundos: 0 });
  };

  const updateScore = (side: 'casa' | 'visitante', delta: number) => {
    if (!id) return;
    const newScore = { ...score, [side]: Math.max(0, score[side] + delta) };
    setScore(newScore);
    
    // Save locally
    DataService.updateScore(id, newScore.casa, newScore.visitante);
  };

  const handleRodarTimes = async (timeId: string) => {
    if (!id) return;
    const updated = DataService.rotateTimes(id, timeId);
    if (updated) {
      setPelada(updated);
      setTimes(updated.times || []);
      toast.success("Time movido para o final da fila!");
    }
  };

  const [showSubModal, setShowSubModal] = useState(false);
  const [showGoalModal, setShowGoalModal] = useState(false);
  const [showCardModal, setShowCardModal] = useState(false);
  const [selectedSaiId, setSelectedSaiId] = useState<string | null>(null);
  const [selectedTimeId, setSelectedTimeId] = useState<string | null>(null);
  const [goalPlayerId, setGoalPlayerId] = useState<string | null>(null);
  const [cardPlayerId, setCardPlayerId] = useState<string | null>(null);

  const handleSubstituir = async (saiId: string, entraId: string) => {
    if (!id) return;
    const updated = DataService.substitutePlayer(id, saiId, entraId);
    if (updated) {
      setPelada(updated);
      setTimes(updated.times || []);
      toast.success("Substituição realizada!");
      setShowSubModal(false);
    }
  };

  const handleRetirarDeCampo = async (jogadorId: string) => {
    if (!id) return;
    const updated = DataService.removePlayerFromField(id, jogadorId);
    if (updated) {
      setPelada(updated);
      setTimes(updated.times || []);
      toast.success("Jogador retirado de campo!");
    }
  };

  const handleRegisterEvent = async (tipo: string, timeId: string, jogadorId: string, assistenciaId?: string) => {
    if (!id) return;
    const jogadorNome = times.flatMap(t => t.jogadores).find(j => j.jogador_id === jogadorId)?.jogador_nome || "Jogador";
    const assistenciaNome = assistenciaId ? times.flatMap(t => t.jogadores).find(j => j.jogador_id === assistenciaId)?.jogador_nome : null;

    if (tipo.includes('cartao') && !window.confirm(`Confirmar ${tipo.replace('_', ' ')} para ${jogadorNome}?`)) {
      return;
    }

    const eventData = {
      tipo,
      time_id: timeId,
      jogador_id: jogadorId,
      jogador_nome: jogadorNome,
      assistencia_nome: assistenciaNome,
      minuto: Math.floor(seconds / 60)
    };

    // 1. Local Update
    const updated = DataService.registerEvent(id, eventData);
    if (updated) {
       setPelada(updated);
       setEventos(updated.eventos || []);

       if (tipo === 'gol') {
        const side = activeTimes.findIndex(t => t.id === timeId) === 0 ? 'casa' : 'visitante';
        updateScore(side, 1);
        setShowGoalModal(false);
      }
      toast.success(`Evento registrado: ${tipo}`);
    }
  };

  const updateTimesJogando = async (val: number) => {
    if (!id) return;
    const nextVal = Math.max(1, Math.min(times.length, val));
    const updated = DataService.updateMatch(id, { times_jogando: nextVal });
    if (updated) {
      setPelada(updated);
      toast.success(`Agora jogando com ${nextVal} times!`);
    }
  };

  if (loading) return <div className="flex flex-col justify-center items-center h-64 space-y-4">
    <Loader2 className="animate-spin text-green-600 h-8 w-8" />
    <p className="text-app-text-muted italic">Carregando jogo ao vivo...</p>
  </div>;

  if (!pelada) {
    return (
      <div className="flex flex-col items-center justify-center p-12 space-y-4">
        <div className="text-app-text-muted text-lg italic uppercase tracking-widest font-black text-center">
          Partida não encontrada<br/>
          <span className="text-[10px] opacity-40 block mt-2 font-mono">ID: {id}</span>
          <span className="text-[10px] opacity-40 block font-mono">API: {import.meta.env.VITE_API_URL || "/api"}</span>
        </div>
        <button 
          onClick={() => navigate("/peladas")}
          className="bg-green-600 text-white px-6 py-2 rounded-xl font-bold hover:bg-green-700 transition"
        >
          Voltar para Peladas
        </button>
      </div>
    );
  }

  const activeTimesCount = pelada?.times_jogando || 2;
  const activeTimes = [...times].sort((a,b) => a.order - b.order).slice(0, activeTimesCount);
  const nextTimes = [...times].sort((a,b) => a.order - b.order).slice(activeTimesCount);

  return (
    <div className="space-y-6 pb-20 max-w-5xl mx-auto px-4 md:px-0">
      <div className="flex items-center justify-between">
        <button onClick={() => navigate(`/peladas/${id}`)} className="bg-app-card p-2 rounded-xl text-app-text-muted flex items-center hover:text-green-500 transition font-bold border border-app-border shadow-sm">
          <ChevronLeft className="w-5 h-5 mr-1" /> Voltar
        </button>
        <div className="flex items-center gap-3">
          {isOrganizador && (
            <div className="flex items-center bg-zinc-800 rounded-xl border border-zinc-700 p-1">
              <button 
                onClick={() => updateTimesJogando(activeTimesCount - 1)}
                className="w-8 h-8 flex items-center justify-center text-white hover:bg-zinc-700 rounded-lg transition"
              >
                -
              </button>
              <div className="px-3 flex items-center gap-2">
                <Users className="w-3 h-3 text-zinc-400" />
                <span className="text-[10px] font-black text-white">{activeTimesCount}</span>
              </div>
              <button 
                onClick={() => updateTimesJogando(activeTimesCount + 1)}
                className="w-8 h-8 flex items-center justify-center text-white hover:bg-zinc-700 rounded-lg transition"
              >
                +
              </button>
            </div>
          )}
          <div className="bg-red-500 text-white px-3 py-1.5 rounded-full text-[10px] font-black animate-pulse tracking-widest flex items-center shadow-[0_0_15px_rgba(239,68,68,0.4)]">
            <div className="w-1.5 h-1.5 bg-white rounded-full mr-2 shadow-[0_0_8px_rgba(255,255,255,0.8)]"></div>
            AO VIVO
          </div>
          <div className="bg-zinc-800 text-zinc-400 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border border-zinc-700">
            ID: {id?.slice(-6)}
          </div>
        </div>
      </div>

      <div className="bg-app-card rounded-[2.5rem] border border-app-border overflow-hidden shadow-2xl">
        {/* Scoreboard - Sprint 7: Grande Placar e Cronômetro */}
        <div className="bg-zinc-950 text-white p-8 md:p-12 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-green-500/10 rounded-full blur-[100px] -mr-48 -mt-48"></div>
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-blue-500/10 rounded-full blur-[100px] -ml-48 -mb-48"></div>
          
          <div className="text-center mb-10 relative z-10">
            <div className="inline-flex items-center gap-2 bg-white/5 border border-white/10 px-4 py-2 rounded-2xl mb-4">
              <Timer className={cn("w-5 h-5 text-green-500", isActive && "animate-pulse")} />
              <span className="text-sm font-black text-zinc-400 uppercase tracking-[0.2em] font-mono">Tempo de Jogo</span>
            </div>
            
            <div className="text-8xl md:text-9xl font-black font-mono tracking-tighter mb-8 text-white drop-shadow-[0_0_20px_rgba(255,255,255,0.1)]">
               {formatTime(seconds)}
            </div>

            {isOrganizador && (
              <div className="flex justify-center gap-4">
                <button 
                  onClick={toggleTimer}
                  className={cn(
                    "px-10 py-4 rounded-2xl transition-all shadow-xl font-black uppercase tracking-widest text-sm flex items-center gap-3 transform active:scale-95",
                    isActive 
                      ? "bg-orange-500 hover:bg-orange-600 shadow-orange-900/40 text-white" 
                      : "bg-green-600 hover:bg-green-700 shadow-green-900/40 text-white"
                  )}
                >
                  {isActive ? <><Pause className="w-5 h-5 fill-current" /> Pausar</> : <><Play className="w-5 h-5 fill-current" /> Começar</>}
                </button>
                <button 
                  onClick={resetTimer} 
                  className="p-4 bg-zinc-800 rounded-2xl hover:bg-zinc-700 transition-all border border-zinc-700 active:scale-95"
                  title="Reiniciar Cronômetro"
                >
                  <RotateCcw className="text-white w-5 h-5" />
                </button>
                <button 
                  onClick={() => setShowSummaryModal(true)} 
                  className="px-6 py-4 bg-zinc-100 dark:bg-zinc-900 rounded-2xl hover:bg-white dark:hover:bg-zinc-800 transition-all border border-zinc-700 shadow-xl font-black text-[10px] uppercase tracking-[0.2em] text-app-text active:scale-95"
                >
                  ENCERRAR
                </button>
              </div>
            )}
          </div>

          <div className="flex flex-col md:flex-row items-center justify-around gap-8 md:gap-4 text-center relative z-10 max-w-4xl mx-auto">
            {activeTimes.map((time, idx) => {
              const coleteStyle = getColeteStyle(time.colete, idx);
              return (
                <React.Fragment key={time.id || `active-${idx}`}>
                  <div className="flex-1 w-full md:w-auto">
                    <div className="flex flex-col items-center">
                      {/* Interactive Team Badge / Colete Selector */}
                      <div className="relative group/badge mb-4">
                        <select
                          value={time.colete || ""}
                          onChange={(e) => {
                            const newColor = e.target.value;
                            if (id) {
                              DataService.updateTeamColete(id, time.id, newColor);
                              fetchData();
                            }
                            toast.success(`Colete do ${time.nome_time} alterado para ${COLETE_COLORS[newColor]?.name || newColor}!`);
                          }}
                          className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-10"
                          title="Mudar colete do time"
                        >
                          {Object.entries(COLETE_COLORS).map(([key, col]) => (
                            <option key={key} value={key} className="text-zinc-900 bg-white">
                              👕 {col.name}
                            </option>
                          ))}
                        </select>
                        <div className={cn(
                          "text-[10px] font-black uppercase tracking-widest px-4 py-1.5 rounded-full border shadow-lg transition-transform hover:scale-105 duration-200 cursor-pointer flex items-center gap-1.5 select-none",
                          coleteStyle.bg,
                          coleteStyle.border,
                          coleteStyle.shadow,
                          coleteStyle.text
                        )}>
                          <span>{time.nome_time || `Time ${idx + 1}`}</span>
                          <span className="text-[9px] opacity-70">▼</span>
                        </div>
                      </div>
                      <div className="text-9xl font-black font-mono text-white tracking-tighter leading-none select-none drop-shadow-2xl">
                        {idx === 0 ? score.casa : score.visitante}
                      </div>
                    
                    {isOrganizador && (
                      <div className="flex flex-col items-center gap-3 mt-8">
                        <div className="flex justify-center gap-3">
                            <button 
                              onClick={() => {
                                setSelectedTimeId(time.id);
                                setGoalPlayerId(null);
                                setShowGoalModal(true);
                              }}
                              className="bg-green-600 px-6 py-3 rounded-2xl hover:bg-green-700 transition-all text-white font-black text-[10px] uppercase tracking-widest shadow-xl shadow-green-900/40 active:scale-95"
                            >
                              GOL
                            </button>
                            <button 
                              onClick={() => {
                                setSelectedTimeId(time.id);
                                setCardPlayerId(null);
                                setShowCardModal(true);
                              }}
                              className="bg-yellow-500 px-6 py-3 rounded-2xl hover:bg-yellow-600 transition-all text-white font-black text-[10px] uppercase tracking-widest shadow-xl shadow-yellow-900/40 active:scale-95"
                            >
                              CARTÃO
                            </button>
                        </div>
                        <div className="flex justify-center gap-2 opacity-50 hover:opacity-100 transition-opacity">
                            <button 
                              onClick={() => updateScore(idx === 0 ? 'casa' : 'visitante', 1)} 
                              className="bg-zinc-800 w-8 h-8 rounded-lg hover:bg-zinc-700 transition-all text-white font-black text-xs shadow-xl border border-zinc-700 active:scale-90"
                            >
                              +
                            </button>
                            <button 
                              onClick={() => updateScore(idx === 0 ? 'casa' : 'visitante', -1)} 
                              className="bg-zinc-800 w-8 h-8 rounded-lg hover:bg-zinc-700 transition-all text-white font-black text-xs shadow-xl border border-zinc-700 active:scale-90"
                            >
                              -
                            </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                {idx === 0 && (
                  <div className="text-4xl md:text-5xl font-black text-zinc-900 border-y border-zinc-900/50 py-2 italic transform -rotate-12 select-none hidden md:block">
                    VS
                  </div>
                )}
              </React.Fragment>
            );
          })}
          </div>
        </div>

        {/* Players in Court */}
        <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-app-border bg-app-bg/5">
          {activeTimes.map((time, tIdx) => {
            const coleteStyle = getColeteStyle(time.colete, tIdx);
            return (
              <div key={time.id || `court-${tIdx}`} className="p-8 space-y-6">
                <div className="flex justify-between items-center border-b border-app-border pb-6">
                  <div className="flex items-center gap-3">
                     <div className={cn("w-4 h-4 rounded-full shadow-[0_0_10px_rgba(0,0,0,0.2)] border", coleteStyle.bg, coleteStyle.border)}></div>
                     <h3 className="font-extrabold text-app-text uppercase tracking-tighter text-base">
                      {time.nome_time}
                    </h3>
                  </div>
                {isOrganizador && (
                  <button 
                    onClick={() => handleRodarTimes(time.id)}
                    className="text-[10px] bg-red-500/10 text-red-500 px-4 py-2.5 rounded-xl font-black hover:bg-red-600 hover:text-white transition-all uppercase tracking-widest border border-red-500/30 shadow-sm active:scale-95"
                  >
                    TIME TERMINOU (SAI)
                  </button>
                )}
              </div>
              <div className="grid grid-cols-1 gap-2">
                {time.jogadores.map((jog, jIdx) => (
                  <div key={jog.id || jog.jogador_id || `jog-${jIdx}`} className="flex justify-between items-center p-4 hover:bg-white dark:hover:bg-zinc-900 rounded-2xl group transition-all border border-transparent hover:border-app-border hover:shadow-md">
                    <div className="flex items-center">
                      <div className="w-10 h-10 rounded-xl bg-app-bg border border-app-border flex items-center justify-center text-app-text font-black text-xs mr-4 shadow-inner group-hover:scale-110 transition-transform relative">
                        {jog.jogador_nome.charAt(0)}
                        {/* Indicadores de Cartão */}
                        <div className="absolute -top-1 -right-1 flex gap-0.5">
                          {eventos.some(e => e.jogador_id === jog.jogador_id && e.tipo === 'cartao_amarelo') && (
                            <div className="w-2 h-3 bg-yellow-400 rounded-sm shadow-sm border border-yellow-500"></div>
                          )}
                          {eventos.some(e => e.jogador_id === jog.jogador_id && e.tipo === 'cartao_vermelho') && (
                            <div className="w-2 h-3 bg-red-500 rounded-sm shadow-sm border border-red-600"></div>
                          )}
                        </div>
                      </div>
                      <div className="flex flex-col">
                        <div className="font-black text-app-text-muted group-hover:text-app-text transition-colors uppercase tracking-tight text-sm flex items-center gap-2">
                          {jog.jogador_nome}
                          {eventos.filter(e => e.jogador_id === jog.jogador_id && e.tipo === 'gol').length > 0 && (
                            <span className="text-[10px] flex items-center gap-0.5 text-green-500">
                              ⚽ <span className="font-black">{eventos.filter(e => e.jogador_id === jog.jogador_id && e.tipo === 'gol').length}</span>
                            </span>
                          )}
                        </div>
                        <div className="text-[9px] text-app-text-muted/60 font-mono tracking-widest">NÍVEL {jog.jogador_nivel}</div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                       {/* Mobile and Desktop interaction */}
                      <div className="flex gap-1.5 md:opacity-0 group-hover:opacity-100 transition-all transform group-hover:translate-x-0 translate-x-2">
                        {isOrganizador && (
                          <>
                            <button 
                              onClick={() => {
                                setSelectedTimeId(time.id);
                                setGoalPlayerId(jog.jogador_id);
                                setShowGoalModal(true);
                              }} 
                              className="p-2.5 bg-green-500/10 text-green-600 rounded-xl hover:bg-green-600 hover:text-white transition-all shadow-sm border border-green-500/20" 
                              title="Registrar Gol"
                            >
                              <Trophy className="w-4 h-4"/>
                            </button>
                            <button 
                              onClick={() => {
                                setSelectedTimeId(time.id);
                                setCardPlayerId(jog.jogador_id);
                                setShowCardModal(true);
                              }} 
                              className="p-2.5 bg-yellow-500/10 text-yellow-600 rounded-xl hover:bg-yellow-500 hover:text-white transition-all shadow-sm border border-yellow-500/20" 
                              title="Registrar Cartão"
                            >
                              <div className="w-3 h-4 bg-yellow-400 rounded-sm"></div>
                            </button>
                            <button 
                              onClick={() => {
                                setSelectedSaiId(jog.jogador_id);
                                setShowSubModal(true);
                              }} 
                              className="p-2.5 bg-blue-500/10 text-blue-600 rounded-xl hover:bg-blue-600 hover:text-white transition-all shadow-sm border border-blue-500/20" 
                              title="Substituir"
                            >
                              <Users className="w-4 h-4"/>
                            </button>
                            <button 
                              onClick={() => handleRetirarDeCampo(jog.jogador_id)} 
                              className="p-2.5 bg-zinc-500/10 text-zinc-600 rounded-xl hover:bg-zinc-600 hover:text-white transition-all shadow-sm border border-zinc-500/20" 
                              title="Retirar de Campo"
                            >
                              <UserMinus className="w-4 h-4"/>
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
                {time.jogadores.length === 0 && (
                   <div className="text-center py-6 text-app-text-muted text-xs italic font-mono border border-dashed border-app-border rounded-2xl">
                     Este time está sem jogadores.
                   </div>
                )}
              </div>
            </div>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-12">
        {/* Next List - Sprint 6: Lista única de próximas */}
        <div className="md:col-span-1 space-y-6">
          <div className="flex items-center justify-between px-2">
            <h2 className="text-lg font-black text-app-text flex items-center uppercase tracking-tighter">
              <Users className="w-6 h-6 mr-3 text-green-500" />
              PRÓXIMAS
            </h2>
            <span className="text-[10px] font-black bg-zinc-100 dark:bg-zinc-800 text-app-text-muted px-3 py-1 rounded-full border border-app-border">
              {nextTimes.length} TIMES
            </span>
          </div>
          <div className="space-y-4">
            {nextTimes.map((time, idx) => (
              <div key={time.id || `next-${idx}`} className="bg-app-card p-6 rounded-[2rem] border border-app-border shadow-lg relative overflow-hidden group hover:border-green-500/40 transition-all">
                <div className="flex justify-between items-center mb-4">
                  <div className="flex flex-col">
                    <span className="font-black text-app-text text-base group-hover:text-green-500 transition-colors uppercase tracking-tight">
                      {time.nome_time}
                    </span>
                    <span className="text-[9px] font-black text-zinc-400 uppercase tracking-widest">{idx + activeTimesCount + 1}º NA FILA</span>
                  </div>
                  <div className="bg-zinc-100 dark:bg-zinc-800 p-2 rounded-xl border border-app-border">
                    <History className="w-4 h-4 text-zinc-400" />
                  </div>
                </div>
                <div className="grid grid-cols-1 gap-2 border-t border-app-border/40 pt-4">
                  {time.jogadores.map((j, jIdx) => (
                    <div key={j.id || j.jogador_id || `next-jog-${jIdx}`} className="text-xs text-app-text-muted flex justify-between font-bold">
                      <span className="group-hover:text-app-text transition-colors">{j.jogador_nome}</span>
                      <span className="text-zinc-400 dark:text-zinc-600 font-mono text-[9px] uppercase">{j.jogador_id.slice(-4)}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
            {nextTimes.length === 0 && (
              <div className="text-center py-12 px-6 text-app-text-muted text-sm italic font-serif bg-app-card rounded-[2rem] border border-app-border border-dashed opacity-60">
                Nenhum time na fila de espera.
              </div>
            )}
          </div>
        </div>

        {/* Live Feed / Events */}
        <div className="md:col-span-2 space-y-6">
           <h2 className="text-lg font-black text-app-text flex items-center uppercase tracking-tighter px-2">
            <History className="w-6 h-6 mr-3 text-blue-500" />
            RESUMO DA PARTIDA
          </h2>
          <div className="bg-app-card rounded-[2.5rem] border border-app-border shadow-xl min-h-[400px] overflow-hidden">
            <div className="divide-y divide-app-border/40">
              {eventos.map((ev, evIdx) => (
                <div key={ev.id || `ev-${evIdx}`} className="p-6 flex items-center gap-6 hover:bg-zinc-50 dark:hover:bg-zinc-900/30 transition-all transform hover:scale-[1.01]">
                  <div className="bg-zinc-100 dark:bg-zinc-800 p-3 rounded-2xl text-[10px] font-black text-app-text-muted font-mono w-14 text-center uppercase tracking-tighter shadow-inner border border-app-border">
                    {ev.minuto}'
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-bold text-app-text-muted flex items-center gap-3">
                      <span className="text-app-text group-hover:text-green-500 underline decoration-2 decoration-transparent group-hover:decoration-green-500 transition-all">
                        {ev.jogador_nome}
                      </span>
                      <div className="h-1 w-1 rounded-full bg-app-border"></div>
                      <span className="font-normal text-app-text-muted/80">
                        {ev.tipo === 'gol' && (
                          <span className="flex items-center gap-2">
                            Gooooooooool! ⚽
                            {ev.assistencia_nome && (
                              <span className="text-[10px] text-zinc-400 font-medium italic">(Assistência: {ev.assistencia_nome})</span>
                            )}
                          </span>
                        )}
                        {ev.tipo === 'assistencia' && <span className="flex items-center gap-2">Passe açucarado! 👟</span>}
                        {ev.tipo === 'cartao_amarelo' && <span className="flex items-center gap-2">Cartão amarelo exibido 🟨</span>}
                        {ev.tipo === 'cartao_vermelho' && <span className="flex items-center gap-2 font-black text-red-500">EXPULSO! 🟥</span>}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
              {eventos.length === 0 && (
                <div className="p-24 text-center text-app-text-muted italic font-serif opacity-40">
                  A partida está sendo estudada. Nenhuma incidência até agora.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      {/* Modals */}
      {showSubModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-app-card rounded-2xl w-full max-w-md border border-app-border shadow-2xl overflow-hidden flex flex-col max-h-[80vh]">
            <div className="p-6 border-b border-app-border flex items-center justify-between">
              <h2 className="text-xl font-bold text-app-text italic font-serif">Quem entra?</h2>
              <button onClick={() => setShowSubModal(false)} className="p-2 text-app-text-muted hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"><X className="h-5 w-5" /></button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {nextTimes.map((time, ntIdx) => (
                <div key={time.id || `modal-nt-${ntIdx}`} className="space-y-2">
                  <div className="text-[10px] font-black text-app-text-muted uppercase tracking-widest pl-1">{time.nome_time}</div>
                  <div className="grid grid-cols-1 gap-2">
                    {time.jogadores.map((jog, mjIdx) => (
                      <button 
                        key={jog.id || jog.jogador_id || `modal-jog-${mjIdx}`}
                        onClick={() => selectedSaiId && handleSubstituir(selectedSaiId, jog.jogador_id)}
                        className="flex items-center justify-between p-3 rounded-xl border border-app-border bg-app-bg hover:bg-green-500/10 hover:border-green-500/30 transition-all text-left group"
                      >
                        <span className="font-bold text-app-text-muted group-hover:text-green-500 transition-colors uppercase tracking-tight">{jog.jogador_nome}</span>
                        <UserPlus className="w-4 h-4 text-green-500" />
                      </button>
                    ))}
                  </div>
                </div>
              ))}
              {nextTimes.length === 0 && <div className="text-center py-12 text-app-text-muted italic font-serif opacity-50">Lista de próximas vazia.</div>}
            </div>
          </div>
        </div>
      )}

      {showGoalModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-app-card rounded-2xl w-full max-w-md border border-app-border shadow-2xl overflow-hidden flex flex-col max-h-[80vh]">
            <div className="p-6 border-b border-app-border flex items-center justify-between bg-zinc-950">
              <h2 className="text-xl font-black text-white uppercase tracking-tighter flex items-center gap-2">
                <Trophy className="w-6 h-6 text-yellow-500" />
                Registrar Gol
              </h2>
              <button onClick={() => setShowGoalModal(false)} className="p-2 text-zinc-400 hover:bg-zinc-800 rounded-lg transition-colors"><X className="h-5 w-5" /></button>
            </div>
            <div className="p-6 space-y-6 text-app-text">
              {!goalPlayerId ? (
                <div className="space-y-4">
                  <div className="text-[10px] font-black text-app-text-muted uppercase tracking-[0.2em] mb-2 px-2">Quem marcou o gol?</div>
                  <div className="grid grid-cols-1 gap-2 overflow-y-auto max-h-60 pr-2">
                    {times.find(t => t.id === selectedTimeId)?.jogadores.map((j, gIdx) => (
                      <button 
                        key={j.id || j.jogador_id || `goal-select-${gIdx}`}
                        onClick={() => setGoalPlayerId(j.jogador_id)}
                        className="flex items-center justify-between p-4 rounded-2xl border border-app-border bg-app-bg hover:bg-green-500/10 hover:border-green-500/30 transition-all group"
                      >
                        <span className="font-bold text-app-text group-hover:text-green-500 transition-colors uppercase tracking-tight">{j.jogador_nome}</span>
                        <div className="w-8 h-8 rounded-lg bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center font-black group-hover:bg-green-500 group-hover:text-white transition-all text-xs">⚽</div>
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex items-center gap-4 p-4 bg-zinc-100 dark:bg-zinc-800 rounded-2xl border border-app-border">
                    <div className="w-12 h-12 bg-green-500 flex items-center justify-center rounded-xl text-white font-black text-xl shadow-lg">
                      ⚽
                    </div>
                    <div>
                      <div className="text-[10px] font-black text-app-text-muted uppercase tracking-widest leading-none mb-1">Goleador</div>
                      <div className="text-lg font-black text-app-text uppercase tracking-tighter flex items-center gap-2">
                        {times.flatMap(t => t.jogadores).find(j => j.jogador_id === goalPlayerId)?.jogador_nome}
                        <button onClick={() => setGoalPlayerId(null)} className="text-[10px] text-blue-500 hover:underline">Alterar</button>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <label className="text-xs font-black text-app-text-muted uppercase tracking-widest flex items-center gap-2">
                      <Handshake className="w-3 h-3" /> Houve assistência?
                    </label>
                    <div className="grid grid-cols-1 gap-2 overflow-y-auto max-h-60 pr-2">
                      <button 
                        onClick={() => selectedTimeId && goalPlayerId && handleRegisterEvent('gol', selectedTimeId, goalPlayerId)}
                        className="p-4 bg-app-bg rounded-2xl font-black text-app-text flex justify-between items-center hover:bg-green-500/10 hover:border-green-500/30 transition-all uppercase tracking-tight border border-app-border group"
                      >
                        <span>Sem Assistência</span>
                        <Plus className="w-4 h-4 opacity-0 group-hover:opacity-100 text-green-500" />
                      </button>
                      <div className="pt-2 text-[10px] text-zinc-400 uppercase tracking-widest font-black opacity-50 px-2">Garçons do {times.find(t => t.id === selectedTimeId)?.nome_time}:</div>
                      {times.find(t => t.id === selectedTimeId)?.jogadores.filter(j => j.jogador_id !== goalPlayerId).map((j, gIdx) => (
                        <button 
                          key={j.id || j.jogador_id || `goal-jog-${gIdx}`}
                          onClick={() => selectedTimeId && goalPlayerId && handleRegisterEvent('gol', selectedTimeId, goalPlayerId, j.jogador_id)}
                          className="flex items-center justify-between p-4 rounded-2xl border border-app-border bg-app-bg hover:bg-blue-500/10 hover:border-blue-500/30 transition-all group"
                        >
                          <span className="font-bold text-app-text group-hover:text-blue-500 transition-colors uppercase tracking-tight">{j.jogador_nome}</span>
                          <Plus className="w-4 h-4 text-zinc-400 group-hover:text-blue-500" />
                        </button>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {showCardModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-app-card rounded-2xl w-full max-w-md border border-app-border shadow-2xl overflow-hidden flex flex-col">
            <div className="p-6 border-b border-app-border flex items-center justify-between bg-zinc-950">
              <h2 className="text-xl font-black text-white uppercase tracking-tighter">Registrar Cartão</h2>
              <button 
                onClick={() => {
                  setShowCardModal(false);
                  setCardPlayerId(null);
                }} 
                className="p-2 text-zinc-400 hover:bg-zinc-800 rounded-lg transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="p-8 space-y-8">
              {!cardPlayerId ? (
                <div className="space-y-4">
                  <div className="text-[10px] font-black text-app-text-muted uppercase tracking-[0.2em] mb-2 px-2 text-center">Para quem é o cartão?</div>
                  <div className="grid grid-cols-1 gap-2 overflow-y-auto max-h-60 pr-2">
                    {times.find(t => t.id === selectedTimeId)?.jogadores.map((j, gIdx) => (
                      <button 
                        key={j.id || j.jogador_id || `card-select-${gIdx}`}
                        onClick={() => setCardPlayerId(j.jogador_id)}
                        className="flex items-center justify-between p-4 rounded-2xl border border-app-border bg-app-bg hover:bg-yellow-500/10 hover:border-yellow-500/30 transition-all group"
                      >
                        <span className="font-bold text-app-text group-hover:text-app-text transition-colors uppercase tracking-tight">{j.jogador_nome}</span>
                        <div className="w-6 h-8 bg-yellow-400 rounded-sm shadow-sm group-hover:bg-yellow-500 transition-all"></div>
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <>
                  <div className="text-center">
                    <div className="text-[10px] font-black text-app-text-muted uppercase tracking-widest mb-2">Advertência para</div>
                    <div className="text-2xl font-black text-app-text uppercase tracking-tighter flex items-center justify-center gap-3">
                      {times.flatMap(t => t.jogadores).find(j => j.jogador_id === cardPlayerId)?.jogador_nome}
                      <button onClick={() => setCardPlayerId(null)} className="text-[10px] text-blue-500 hover:underline">Alterar</button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <button 
                       onClick={() => selectedTimeId && cardPlayerId && handleRegisterEvent('cartao_amarelo', selectedTimeId, cardPlayerId).then(() => setShowCardModal(false))}
                       className="flex flex-col items-center gap-4 p-8 bg-zinc-50 dark:bg-zinc-900/50 rounded-[2rem] border border-app-border hover:bg-yellow-500/10 hover:border-yellow-500/50 transition-all group shadow-sm"
                    >
                      <div className="w-10 h-14 bg-yellow-400 rounded-lg shadow-lg group-hover:rotate-6 transition-transform"></div>
                      <span className="font-black text-app-text uppercase tracking-widest text-[10px]">Amarelo</span>
                    </button>
                    <button 
                       onClick={() => selectedTimeId && cardPlayerId && handleRegisterEvent('cartao_vermelho', selectedTimeId, cardPlayerId).then(() => setShowCardModal(false))}
                       className="flex flex-col items-center gap-4 p-8 bg-zinc-50 dark:bg-zinc-900/50 rounded-[2rem] border border-app-border hover:bg-red-500/10 hover:border-red-500/50 transition-all group shadow-sm"
                    >
                      <div className="w-10 h-14 bg-red-600 rounded-lg shadow-lg group-hover:-rotate-6 transition-transform"></div>
                      <span className="font-black text-app-text uppercase tracking-widest text-[10px]">Vermelho</span>
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
      {showSummaryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="bg-app-card rounded-[3rem] w-full max-w-2xl border border-app-border shadow-2xl overflow-hidden flex flex-col relative">
            <div className="absolute top-0 right-0 p-6">
               <button onClick={() => setShowSummaryModal(false)} className="text-zinc-500 hover:text-white transition-colors"><X/></button>
            </div>

            <div className="bg-zinc-950 p-12 text-center relative overflow-hidden">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full bg-green-500/10 blur-[100px] pointer-events-none"></div>
                <div className="relative z-10">
                   <div className="text-zinc-500 font-black uppercase tracking-[0.4em] text-[10px] mb-4">Resultado Final</div>
                   <div className="flex items-center justify-center gap-12">
                      <div className="text-center">
                         <div className={cn("text-[10px] font-black text-white px-3 py-1 rounded-full mb-3 uppercase tracking-widest border border-white/10 shadow-lg", getColeteStyle(activeTimes[0]?.colete, 0).bg, getColeteStyle(activeTimes[0]?.colete, 0).border)}>{activeTimes[0]?.nome_time}</div>
                         <div className="text-7xl font-black text-white font-mono">{score.casa}</div>
                      </div>
                      <div className="text-4xl font-black text-zinc-900 border-x border-zinc-900 px-8 py-2 italic transform -rotate-12">VS</div>
                      <div className="text-center">
                         <div className={cn("text-[10px] font-black text-white px-3 py-1 rounded-full mb-3 uppercase tracking-widest border border-white/10 shadow-lg", getColeteStyle(activeTimes[1]?.colete, 1).bg, getColeteStyle(activeTimes[1]?.colete, 1).border)}>{activeTimes[1]?.nome_time}</div>
                         <div className="text-7xl font-black text-white font-mono">{score.visitante}</div>
                      </div>
                   </div>
                </div>
            </div>

            <div className="p-10 flex-1 overflow-y-auto max-h-[50vh] space-y-10">
               <div className="grid grid-cols-2 gap-8">
                  <div className="space-y-4">
                     <h3 className="text-[10px] font-black text-app-text-muted uppercase tracking-[0.2em] border-b border-app-border pb-3 flex items-center">
                       <Trophy className="w-3 h-3 mr-2 text-yellow-500" /> Artilharia
                     </h3>
                     <div className="space-y-3">
                        {Array.from(new Set(eventos.filter(e => e.tipo === 'gol').map(e => e.jogador_id)))
                          .map(jid => ({
                            id: jid,
                            nome: eventos.find(e => e.jogador_id === jid)?.jogador_nome,
                            gols: eventos.filter(e => e.jogador_id === jid && e.tipo === 'gol').length
                          }))
                          .sort((a,b) => b.gols - a.gols)
                          .slice(0, 3)
                          .map((art, i) => (
                            <div key={art.id || `art-${i}`} className="flex justify-between items-center bg-app-bg p-3 rounded-2xl border border-app-border shadow-sm">
                               <div className="flex items-center gap-3">
                                  <span className="text-[10px] font-black text-zinc-400 font-mono italic">#{i+1}</span>
                                  <span className="font-black text-app-text uppercase tracking-tight text-xs">{art.nome}</span>
                               </div>
                               <span className="bg-green-500/10 text-green-500 px-3 py-1 rounded-full text-[10px] font-black">{art.gols} GOLS</span>
                            </div>
                          ))}
                        {eventos.filter(e => e.tipo === 'gol').length === 0 && <p className="text-xs text-app-text-muted italic opacity-50">Nenhum gol marcado.</p>}
                     </div>
                  </div>

                  <div className="space-y-4">
                     <h3 className="text-[10px] font-black text-app-text-muted uppercase tracking-[0.2em] border-b border-app-border pb-3 flex items-center">
                       <Handshake className="w-3 h-3 mr-2 text-blue-400" /> Garçons
                     </h3>
                     <div className="space-y-3">
                        {Array.from(new Set(eventos.filter(e => e.assistencia_nome).map(e => e.assistencia_nome)))
                          .map(anome => ({
                            nome: anome,
                            assis: eventos.filter(e => e.assistencia_nome === anome).length
                          }))
                          .sort((a,b) => b.assis - a.assis)
                          .slice(0, 3)
                          .map((gar, i) => (
                            <div key={gar.nome || `gar-${i}`} className="flex justify-between items-center bg-app-bg p-3 rounded-2xl border border-app-border shadow-sm">
                               <div className="flex items-center gap-3">
                                  <span className="text-[10px] font-black text-zinc-400 font-mono italic">#{i+1}</span>
                                  <span className="font-black text-app-text uppercase tracking-tight text-xs">{gar.nome}</span>
                               </div>
                               <span className="bg-blue-500/10 text-blue-500 px-3 py-1 rounded-full text-[10px] font-black">{gar.assis} PASSES</span>
                            </div>
                          ))}
                         {eventos.filter(e => e.assistencia_nome).length === 0 && <p className="text-xs text-app-text-muted italic opacity-50">Nenhuma assistência.</p>}
                     </div>
                  </div>
               </div>

               <div className="pt-6 border-t border-app-border flex justify-end gap-4">
                  <button 
                    onClick={() => setShowSummaryModal(false)}
                    className="px-8 py-3 rounded-2xl text-app-text-muted font-black uppercase tracking-widest text-[10px] hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all border border-app-border"
                  >
                    Voltar ao jogo
                  </button>
                  <button 
                    onClick={() => {
                      if (window.confirm("Finalizar pelada? Isso irá salvar as estatísticas e você não poderá mais editar este jogo.")) {
                        try {
                          DataService.finalizePelada(id!);
                          toast.success("Pelada finalizada com sucesso!");
                          // In local mode, we don't need socket emit as storage event handles it
                          navigate(`/peladas/${id}`);
                        } catch (error) {
                          toast.error("Erro ao finalizar pelada.");
                        }
                      }
                    }}
                    className="px-10 py-3 bg-green-600 hover:bg-green-700 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-xl shadow-green-900/20 active:scale-95 transition-all"
                  >
                    CONFIRMAR FIM DE JOGO ⚽
                  </button>
               </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PeladaLive;
