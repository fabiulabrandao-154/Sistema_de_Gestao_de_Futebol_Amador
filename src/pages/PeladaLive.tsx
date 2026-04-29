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
  Users
} from "lucide-react";
import { toast } from "react-hot-toast";
import api from "../services/api";
import { cn } from "../lib/utils";
import { useAuth } from "../context/AuthContext";
import io from "socket.io-client";

// Connect to the socket server (same host and port)
const socket = io();

interface Jogador {
  id: string;
  jogador_nome: string;
  jogador_nivel: number;
  jogador_id: string;
}

interface Time {
  id: string;
  nome_time: string;
  jogadores: Jogador[];
  soma_estrelas: number;
  ordem: number;
}

interface Evento {
  id: string;
  tipo: 'gol' | 'assistencia' | 'cartao_amarelo' | 'cartao_vermelho';
  jogador_id: string;
  jogador_nome: string;
  minuto: number;
  time_id?: string;
}

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

  const isOrganizador = user?.id === pelada?.organizador;

  useEffect(() => {
    fetchData();
    socket.emit("join-pelada", id);

    socket.on("cronometro-changed", (data) => {
      setSeconds(data.segundos);
      setIsActive(data.ativo);
    });

    socket.on("placar-changed", (data) => {
      setScore({ casa: data.placar_casa, visitante: data.placar_visitante });
    });

    socket.on("evento-recebido", (evento: Evento) => {
      setEventos(prev => [evento, ...prev]);
    });

    return () => {
      socket.off("cronometro-changed");
      socket.off("placar-changed");
      socket.off("evento-recebido");
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

  const fetchData = async () => {
    try {
      const [peladaRes, timesRes, eventosRes] = await Promise.all([
        api.get(`/peladas/${id}/`),
        api.get(`/peladas/${id}/times/`),
        api.get(`/eventos/?pelada=${id}`)
      ]);
      setPelada(peladaRes.data);
      setTimes(timesRes.data.map((t: any) => ({
        ...t,
        jogadores: t.jogadores.map((j: any) => ({
          id: j.id.toString(),
          jogador_nome: j.jogador_nome,
          jogador_nivel: j.jogador_nivel,
          jogador_id: j.jogador
        }))
      })));
      setScore({ casa: peladaRes.data.placar_casa, visitante: peladaRes.data.placar_visitante });
      setSeconds(peladaRes.data.cronometro_segundos);
      setIsActive(peladaRes.data.cronometro_ativo);
      setEventos(eventosRes.data);
    } catch (error) {
      toast.error("Erro ao carregar dados do jogo.");
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
    const nextState = !isActive;
    setIsActive(nextState);
    socket.emit("update-cronometro", { peladaId: id, segundos: seconds, ativo: nextState });
    // Update backend (debounced or on pause usually, but we do it here for now)
    api.put(`/peladas/${id}/`, { cronometro_ativo: nextState, cronometro_segundos: seconds });
  };

  const resetTimer = () => {
    setIsActive(false);
    setSeconds(0);
    socket.emit("update-cronometro", { peladaId: id, segundos: 0, ativo: false });
    api.put(`/peladas/${id}/`, { cronometro_ativo: false, cronometro_segundos: 0 });
  };

  const updateScore = (side: 'casa' | 'visitante', delta: number) => {
    const newScore = { ...score, [side]: Math.max(0, score[side] + delta) };
    setScore(newScore);
    socket.emit("update-placar", { peladaId: id, placar_casa: newScore.casa, placar_visitante: newScore.visitante });
    api.put(`/peladas/${id}/`, { placar_casa: newScore.casa, placar_visitante: newScore.visitante });
  };

  const handleRodarTimes = async (timeId: string) => {
    try {
      await api.post(`/peladas/${id}/rodar-times/`, { time_id: timeId });
      toast.success("Time movido para o final da fila!");
      fetchData();
    } catch (error) {
      toast.error("Erro ao rodar times.");
    }
  };

  const [showSubModal, setShowSubModal] = useState(false);
  const [showGoalModal, setShowGoalModal] = useState(false);
  const [selectedSaiId, setSelectedSaiId] = useState<string | null>(null);
  const [selectedTimeId, setSelectedTimeId] = useState<string | null>(null);
  const [goalPlayerId, setGoalPlayerId] = useState<string | null>(null);

  const handleSubstituir = async (saiId: string, entraId: string) => {
    try {
      await api.post(`/peladas/${id}/substituir/`, { sai_id: saiId, entra_id: entraId });
      toast.success("Substituição realizada!");
      setShowSubModal(false);
      fetchData();
    } catch (error) {
      toast.error("Erro ao substituir.");
    }
  };

  const handleRegisterEvent = async (tipo: string, timeId: string, jogadorId: string, assistenciaId?: string) => {
    try {
      const resp = await api.post(`/eventos/`, {
        pelada: id,
        tipo,
        time: timeId,
        jogador: jogadorId,
        jogador_assistencia: assistenciaId,
        minuto: Math.floor(seconds / 60)
      });
      const novoEvento = resp.data;
      socket.emit("novo-evento", { peladaId: id, evento: novoEvento });
      setEventos(prev => [novoEvento, ...prev]);
      
      if (tipo === 'gol') {
        const side = times.findIndex(t => t.id === timeId) === 0 ? 'casa' : 'visitante';
        updateScore(side, 1);
        setShowGoalModal(false);
      }
      toast.success(`Evento registrado: ${tipo}`);
    } catch (error) {
      toast.error("Erro ao registrar evento.");
    }
  };

  if (loading) return <div className="flex justify-center p-12"><Loader2 className="animate-spin" /></div>;

  const activeTimes = times.sort((a,b) => a.ordem - b.ordem).slice(0, 2);
  const nextTimes = times.sort((a,b) => a.ordem - b.ordem).slice(2);

  return (
    <div className="space-y-6 pb-20 max-w-5xl mx-auto">
      <div className="flex items-center justify-between">
        <button onClick={() => navigate(`/peladas/${id}`)} className="text-gray-500 flex items-center hover:text-green-600 transition">
          <ChevronLeft className="w-4 h-4 mr-1" /> Voltar
        </button>
        <div className="bg-red-500 text-white px-3 py-1 rounded-full text-xs font-bold animate-pulse">
          AO VIVO
        </div>
      </div>

      <div className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden">
        {/* Scoreboard */}
        <div className="bg-gray-900 text-white p-8">
          <div className="text-center mb-6">
            <div className="text-6xl font-black font-mono tracking-tighter mb-2">
              {formatTime(seconds)}
            </div>
            {isOrganizador && (
              <div className="flex justify-center gap-4">
                <button 
                  onClick={toggleTimer}
                  className={cn(
                    "p-3 rounded-full transition",
                    isActive ? "bg-orange-500 hover:bg-orange-600" : "bg-green-600 hover:bg-green-700"
                  )}
                >
                  {isActive ? <Pause className="fill-current" /> : <Play className="fill-current" />}
                </button>
                <button onClick={resetTimer} className="p-3 bg-gray-700 rounded-full hover:bg-gray-600 transition">
                  <RotateCcw />
                </button>
              </div>
            )}
          </div>

          <div className="flex items-center justify-around gap-4 text-center">
            <div className="flex-1">
              <div className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-1">{activeTimes[0]?.nome_time || "Time A"}</div>
              <div className="text-7xl font-black font-mono">{score.casa}</div>
              {isOrganizador && (
                 <div className="flex justify-center gap-2 mt-4">
                    <button onClick={() => updateScore('casa', 1)} className="bg-gray-800 p-2 rounded-lg hover:bg-gray-700">+</button>
                    <button onClick={() => updateScore('casa', -1)} className="bg-gray-800 p-2 rounded-lg hover:bg-gray-700">-</button>
                 </div>
              )}
            </div>
            <div className="text-2xl font-bold text-gray-700">VS</div>
            <div className="flex-1">
              <div className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-1">{activeTimes[1]?.nome_time || "Time B"}</div>
              <div className="text-7xl font-black font-mono">{score.visitante}</div>
              {isOrganizador && (
                 <div className="flex justify-center gap-2 mt-4">
                    <button onClick={() => updateScore('visitante', 1)} className="bg-gray-800 p-2 rounded-lg hover:bg-gray-700">+</button>
                    <button onClick={() => updateScore('visitante', -1)} className="bg-gray-800 p-2 rounded-lg hover:bg-gray-700">-</button>
                 </div>
              )}
            </div>
          </div>
        </div>

        {/* Players in Court */}
        <div className="grid grid-cols-1 md:grid-cols-2 divide-x divide-gray-100">
          {activeTimes.map((time, tIdx) => (
            <div key={time.id} className="p-6 space-y-4">
              <div className="flex justify-between items-center border-b border-gray-50 pb-3">
                <h3 className="font-bold text-gray-900 flex items-center">
                  <span className={cn("w-3 h-3 rounded-full mr-2", tIdx === 0 ? "bg-red-500" : "bg-blue-500")}></span>
                  Jogadores em Quadra
                </h3>
                {isOrganizador && (
                  <button 
                    onClick={() => handleRodarTimes(time.id)}
                    className="text-[10px] bg-gray-100 px-2 py-1 rounded font-bold hover:bg-gray-200"
                  >
                    SAIR DA QUADRA
                  </button>
                )}
              </div>
              <div className="space-y-2">
                {time.jogadores.map(jog => (
                  <div key={jog.id} className="flex justify-between items-center text-sm p-2 hover:bg-gray-50 rounded-lg group">
                    <div className="font-medium text-gray-800">{jog.jogador_nome}</div>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition">
                      {isOrganizador && (
                        <>
                          <button 
                            onClick={() => {
                              setSelectedTimeId(time.id);
                              setGoalPlayerId(jog.jogador_id);
                              setShowGoalModal(true);
                            }} 
                            className="p-1 text-green-600 hover:scale-110" 
                            title="Gol"
                          >
                            <Trophy className="w-3.5 h-3.5"/>
                          </button>
                          <button onClick={() => handleRegisterEvent('cartao_amarelo', time.id, jog.jogador_id)} className="p-1 text-yellow-500 hover:scale-110" title="Card Amarelo"><Info className="w-3.5 h-3.5"/></button>
                          <button 
                            onClick={() => {
                              setSelectedSaiId(jog.jogador_id);
                              setShowSubModal(true);
                            }} 
                            className="p-1 text-blue-500 hover:scale-110" 
                            title="Substituir"
                          >
                            <Users className="w-3.5 h-3.5"/>
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Next List */}
        <div className="md:col-span-1 space-y-4">
          <h2 className="text-lg font-bold text-gray-900 flex items-center px-1">
            <Users className="w-5 h-5 mr-2 text-green-600" />
            PRÓXIMAS
          </h2>
          <div className="space-y-3">
            {nextTimes.map((time) => (
              <div key={time.id} className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm relative overflow-hidden">
                <div className="flex justify-between items-center mb-3">
                  <span className="font-bold text-gray-900 text-sm">{time.nome_time}</span>
                  <span className="text-[10px] text-gray-400 font-mono italic">Aguardando...</span>
                </div>
                <div className="space-y-1">
                  {time.jogadores.map(j => (
                    <div key={j.id} className="text-xs text-gray-600 flex justify-between">
                      <span>{j.jogador_nome}</span>
                      <span className="text-gray-300 font-mono text-[9px]">{j.jogador_id}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
            {nextTimes.length === 0 && <div className="text-center py-8 text-gray-400 text-sm italic">Nenhum time na fila.</div>}
          </div>
        </div>

        {/* Live Feed / Events */}
        <div className="md:col-span-2 space-y-4">
           <h2 className="text-lg font-bold text-gray-900 flex items-center px-1">
            <History className="w-5 h-5 mr-2 text-blue-600" />
            ACONTECIMENTOS
          </h2>
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm min-h-[300px] overflow-hidden">
            <div className="divide-y divide-gray-50">
              {eventos.map(ev => (
                <div key={ev.id} className="p-4 flex items-center gap-4 hover:bg-gray-50 transition">
                  <div className="bg-gray-100 p-2 rounded-lg text-xs font-bold text-gray-500 font-mono w-12 text-center">
                    {ev.minuto}'
                  </div>
                  <div className="flex-1">
                    <div className="text-sm">
                      <span className="font-bold text-gray-900">{ev.jogador_nome}</span>
                      <span className="text-gray-500 ml-2">
                        {ev.tipo === 'gol' && "marcou um golo! ⚽"}
                        {ev.tipo === 'assistencia' && "deu uma assistência! 👟"}
                        {ev.tipo === 'cartao_amarelo' && "levou cartão amarelo 🟨"}
                        {ev.tipo === 'cartao_vermelho' && "foi expulso! 🟥"}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
              {eventos.length === 0 && <div className="p-12 text-center text-gray-400 italic">O jogo ainda não teve grandes eventos.</div>}
            </div>
          </div>
        </div>
      </div>
      {/* Modals */}
      {showSubModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-xl overflow-hidden flex flex-col max-h-[80vh]">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">Quem entra?</h2>
              <button onClick={() => setShowSubModal(false)} className="p-2 text-gray-400 hover:bg-gray-100 rounded-lg"><X className="h-5 w-5" /></button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {nextTimes.map(time => (
                <div key={time.id} className="space-y-2">
                  <div className="text-xs font-bold text-gray-400 uppercase tracking-widest">{time.nome_time}</div>
                  <div className="grid grid-cols-1 gap-2">
                    {time.jogadores.map(jog => (
                      <button 
                        key={jog.id}
                        onClick={() => selectedSaiId && handleSubstituir(selectedSaiId, jog.jogador_id)}
                        className="flex items-center justify-between p-3 rounded-xl border border-gray-100 hover:bg-green-50 hover:border-green-200 transition text-left"
                      >
                        <span className="font-semibold text-gray-800">{jog.jogador_nome}</span>
                        <UserPlus className="w-4 h-4 text-green-500" />
                      </button>
                    ))}
                  </div>
                </div>
              ))}
              {nextTimes.length === 0 && <div className="text-center py-12 text-gray-400 italic">Lista de próximas vazia.</div>}
            </div>
          </div>
        </div>
      )}

      {showGoalModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-xl overflow-hidden flex flex-col max-h-[80vh]">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">Registrar Gol</h2>
              <button onClick={() => setShowGoalModal(false)} className="p-2 text-gray-400 hover:bg-gray-100 rounded-lg"><X className="h-5 w-5" /></button>
            </div>
            <div className="p-6 space-y-6">
              <div className="space-y-3">
                <label className="text-sm font-bold text-gray-500 uppercase">Houve Assistência?</label>
                <div className="grid grid-cols-1 gap-2 overflow-y-auto max-h-60 pr-2">
                  <button 
                    onClick={() => selectedTimeId && goalPlayerId && handleRegisterEvent('gol', selectedTimeId, goalPlayerId)}
                    className="p-3 bg-gray-50 rounded-xl font-bold text-gray-700 hover:bg-green-50 hover:text-green-700 transition"
                  >
                    Sem Assistência
                  </button>
                  <div className="pt-2 text-[10px] text-gray-400 uppercase tracking-widest font-bold">Ou escolha o garçom:</div>
                  {times.find(t => t.id === selectedTimeId)?.jogadores.filter(j => j.jogador_id !== goalPlayerId).map(j => (
                    <button 
                      key={j.id}
                      onClick={() => selectedTimeId && goalPlayerId && handleRegisterEvent('gol', selectedTimeId, goalPlayerId, j.jogador_id)}
                      className="flex items-center justify-between p-3 rounded-xl border border-gray-100 hover:bg-blue-50 hover:border-blue-200 transition"
                    >
                      <span className="font-semibold text-gray-800">{j.jogador_nome}</span>
                      <Plus className="w-4 h-4 text-blue-500" />
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PeladaLive;
