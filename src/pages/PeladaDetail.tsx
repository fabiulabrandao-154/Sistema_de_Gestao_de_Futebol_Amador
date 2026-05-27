import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { 
  ChevronLeft, 
  Plus, 
  Trash2, 
  CheckCircle2, 
  Circle, 
  GripVertical,
  Users,
  Search,
  Loader2,
  X,
  Play,
  RotateCcw,
  DollarSign,
  Info,
  Trophy,
  Handshake,
  Award,
  Activity,
  Calendar,
  Clock
} from "lucide-react";
import { toast } from "react-hot-toast";
import api from "../services/api";
import { cn } from "../lib/utils";
import DataService, { Pelada, Player } from "../services/dataService";
import io from "../services/socket";
import { useAuth } from "../context/AuthContext";
const socket = io;

const getColeteStyle = (cor: string | undefined, defaultIdx: number) => {
  const finalCor = cor || (defaultIdx === 0 ? "vermelho" : "azul");
  switch (finalCor.toLowerCase()) {
    case 'vermelho': return { bg: 'bg-red-500/10 text-red-500 border-red-500/20', circle: 'bg-red-500', hover: 'hover:bg-red-500/20' };
    case 'azul': return { bg: 'bg-blue-500/10 text-blue-500 border-blue-500/20', circle: 'bg-blue-500', hover: 'hover:bg-blue-500/20' };
    case 'verde': return { bg: 'bg-green-500/10 text-green-500 border-green-500/20', circle: 'bg-green-500', hover: 'hover:bg-green-500/20' };
    case 'amarelo': return { bg: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20', circle: 'bg-yellow-500', hover: 'hover:bg-yellow-500/20' };
    case 'laranja': return { bg: 'bg-amber-500/10 text-amber-500 border-amber-500/20', circle: 'bg-amber-500', hover: 'hover:bg-amber-500/20' };
    case 'roxo': return { bg: 'bg-purple-500/10 text-purple-500 border-purple-500/20', circle: 'bg-purple-500', hover: 'hover:bg-purple-500/20' };
    case 'rosa': return { bg: 'bg-pink-500/10 text-pink-500 border-pink-500/20', circle: 'bg-pink-500', hover: 'hover:bg-pink-500/20' };
    case 'preto': return { bg: 'bg-zinc-800 text-zinc-300 border-zinc-700', circle: 'bg-zinc-950', hover: 'hover:bg-zinc-800' };
    case 'branco': return { bg: 'bg-white text-zinc-800 border-zinc-200', circle: 'bg-zinc-100', hover: 'hover:bg-zinc-50' };
    default: return { bg: 'bg-zinc-500/10 text-zinc-500 border-zinc-500/20', circle: 'bg-zinc-500', hover: 'hover:bg-zinc-500/20' };
  }
};

const PeladaDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [pelada, setPelada] = useState<Pelada | null>(null);
  const [availablePlayers, setAvailablePlayers] = useState<Player[]>([]);
  const [isFetching, setIsFetching] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'inscritos' | 'pagamentos' | 'config' | 'resumo'>('inscritos');
  const [searchTerm, setSearchTerm] = useState("");
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

    const isOrganizador = true; // Full local mode priority
    const canSeeFinance = true;

    useEffect(() => {
      if (pelada && (pelada.status === 'finalizada' || pelada.status === 'encerrada') && activeTab === 'inscritos') {
        setActiveTab('resumo');
      }
    }, [pelada]);

    useEffect(() => {
      fetchData();

      const handleStorageChange = (e: StorageEvent) => {
        if (e.key === "peladas" || e.key === "jogadores") {
          fetchData();
        }
      };

      window.addEventListener('storage', handleStorageChange);

      return () => {
        window.removeEventListener('storage', handleStorageChange);
      };
    }, [id]);

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (pelada?.cronometro_ativo) {
      interval = setInterval(() => {
        setPelada(prev => prev ? ({
          ...prev,
          cronometro_segundos: (prev.cronometro_segundos || 0) + 1
        }) : null);
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [pelada?.cronometro_ativo]);

  const fetchData = () => {
    if (!id) return;
    setIsFetching(true);
    try {
      const localPelada = DataService.getPeladaById(id);
      const localPlayers = DataService.getPlayers();
      
      if (localPelada) {
        localPelada.inscritos?.sort((a, b) => a.ordem_chegada - b.ordem_chegada);
        setPelada(localPelada);
      }
      
      const activePlayers = localPlayers.filter(p => p.ativo);
      activePlayers.sort((a, b) => (a.nome || "").localeCompare(b.nome || ""));
      setAvailablePlayers(activePlayers);
    } catch (error) {
      console.error("Fatal error in fetchData:", error);
    } finally {
      setIsFetching(false);
    }
  };

  const handleAddPlayer = (jogadorId: string) => {
    if (!id) return;
    const player = availablePlayers.find(p => p.id === jogadorId);
    if (!player) return;

    // Local Update
    const updated = DataService.addPlayerToPelada(id, jogadorId);
    if (updated) {
       setPelada(updated);
       toast.success("Jogador adicionado!");
       setIsAddModalOpen(false);
       setSearchTerm("");
    }
  };

  const handleRemovePlayer = (peladaJogadorId: string) => {
    if (!id) return;
    const updated = DataService.removePlayerFromPelada(id, peladaJogadorId);
    if (updated) {
      setPelada(updated);
      toast.success("Jogador removido.");
    }
  };

  const handleTogglePresence = (peladaJogadorId: string, current: boolean) => {
    if (!id) return;
    const updated = DataService.togglePresence(id, peladaJogadorId);
    if (updated) {
      setPelada(updated);
      toast.success(!current ? "Presença confirmada!" : "Presença removida");
    }
  };

  const handleTogglePayment = (peladaJogadorId: string, current: boolean) => {
    if (!id) return;
    const updated = DataService.togglePayment(id, peladaJogadorId);
    if (updated) {
      setPelada(updated);
      toast.success(!current ? "Pagamento confirmado!" : "Pagamento cancelado");
    }
  };

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showFinalizeConfirm, setShowFinalizeConfirm] = useState(false);

  const confirmDeletePelada = () => {
    if (!id) return;
    try {
      DataService.deletePelada(id);
      toast.success("Pelada excluída com sucesso.");
      navigate("/peladas");
    } catch (error) {
      toast.error("Erro ao excluir pelada.");
    } finally {
      setShowDeleteConfirm(false);
    }
  };

  const confirmFinalizePelada = () => {
    if (!id) return;
    try {
      DataService.finalizePelada(id);
      toast.success("Pelada finalizada com sucesso!");
      fetchData();
    } catch (error) {
      toast.error("Erro ao finalizar pelada.");
    } finally {
      setShowFinalizeConfirm(false);
    }
  };

  const handleDragDrop = (fromIndex: number, toIndex: number) => {
    if (!pelada || !id || fromIndex === toIndex) return;
    const inscritos = [...(pelada.inscritos || [])].sort((a, b) => a.ordem_chegada - b.ordem_chegada);
    
    const [movedPlayer] = inscritos.splice(fromIndex, 1);
    inscritos.splice(toIndex, 0, movedPlayer);

    const playerIdsByOrder = inscritos.map(i => i.jogador);
    
    const updated = DataService.reorderPlayers(id, playerIdsByOrder);
    if (updated) {
       setPelada(updated);
       toast.success("Ordem de chegada atualizada!");
    }
  };

  const filteredAvailable = availablePlayers.filter(p => 
    p.nome.toLowerCase().includes(searchTerm.toLowerCase()) && 
    !pelada?.inscritos.some(i => i.jogador === p.id)
  );

  if (!pelada && !isFetching) {
    return (
      <div className="flex flex-col items-center justify-center p-12 space-y-4">
        <div className="text-app-text-muted text-lg italic text-center">
          Pelada não encontrada ou erro ao carregar.<br/>
          <span className="text-xs opacity-50 block mt-2">ID: {id}</span>
          <span className="text-xs opacity-50 block">API: {import.meta.env.VITE_API_URL || "/api"}</span>
        </div>
        <button 
          onClick={fetchData}
          className="bg-green-600 text-white px-6 py-2 rounded-xl font-bold hover:bg-green-700 transition"
        >
          Tentar Novamente
        </button>
        <button 
          onClick={() => navigate("/peladas")}
          className="text-app-text-muted hover:text-app-text transition"
        >
          Voltar para Lista
        </button>
      </div>
    );
  }

  if (isFetching && !pelada) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-green-600" />
      </div>
    );
  }

  if (!pelada) return (
    <div className="flex flex-col items-center justify-center p-12 space-y-4">
      <div className="text-app-text-muted text-lg italic uppercase tracking-widest font-black">Pelada não encontrada</div>
      <button 
        onClick={() => navigate("/peladas")}
        className="bg-green-600 text-white px-6 py-2 rounded-xl font-bold hover:bg-green-700 transition"
      >
        Voltar para Peladas
      </button>
    </div>
  );

  const confirmedCount = (pelada.inscritos || []).filter(i => i.presenca_confirmada).length;
  const payerCount = (pelada.inscritos || []).filter(i => i.pagamento_confirmado).length;
  const valorPorPessoa = pelada.valor_por_jogador && pelada.valor_por_jogador > 0 
    ? pelada.valor_por_jogador 
    : (Number(pelada.valor_total || 0) / Math.max(1, confirmedCount));
  const valorArrecadado = valorPorPessoa * payerCount;
  const progressPercent = confirmedCount > 0 ? (payerCount / confirmedCount) * 100 : 0;

  return (
    <div className="space-y-6">
      <button 
        onClick={() => navigate("/peladas")}
        className="flex items-center text-app-text-muted hover:text-green-500 transition"
      >
        <ChevronLeft className="w-4 h-4 mr-1" />
        Voltar para Peladas
      </button>

      <div className="bg-app-card rounded-2xl border border-app-border p-6 shadow-sm">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-black text-app-text uppercase tracking-tighter">{pelada.titulo || 'Pelada'}</h1>
            <p className="text-app-text-muted font-medium italic flex items-center mt-1">
              {pelada.local || 'Local não definido'} • {pelada.data_hora ? new Date(pelada.data_hora).toLocaleString() : 'Data não informada'}
            </p>
          </div>
          <div className="flex gap-3">
             <button 
              onClick={() => navigate(`/peladas/${id}/sorteio`)}
              className="bg-zinc-900 border border-zinc-800 text-zinc-100 px-6 py-2.5 rounded-xl flex items-center hover:bg-zinc-800 transition font-black uppercase tracking-widest text-[10px] shadow-lg"
            >
              <Users className="w-3.5 h-3.5 mr-2" />
              Sorteio Automático
            </button>
            <button 
              onClick={() => navigate(`/peladas/${id}/live`)}
              className={cn(
                "px-6 py-2.5 rounded-xl flex items-center transition font-black uppercase tracking-widest text-[10px] shadow-lg",
                pelada.status === 'encerrada' || pelada.status === 'finalizada'
                  ? "bg-zinc-800 text-zinc-400 border border-zinc-700 hover:bg-zinc-700"
                  : "bg-green-600 text-white hover:bg-green-700 shadow-green-900/20"
              )}
            >
              <Play className="w-3.5 h-3.5 mr-2 fill-current" />
              {pelada.status === 'encerrada' || pelada.status === 'finalizada' ? 'Ver Resumo/Súmula' : 'Jogo ao Vivo'}
            </button>
          </div>
        </div>
      </div>

      {pelada.status === 'em_andamento' && (
        <div className="bg-zinc-950 rounded-2xl border border-zinc-800 p-8 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-green-500/10 rounded-full blur-[80px] -mr-32 -mt-32"></div>
          <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-8">
            <div className="flex flex-col items-center md:items-start text-center md:text-left">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                <span className="text-[10px] font-black text-red-500 uppercase tracking-widest">Partida em Andamento</span>
              </div>
              <div className="text-4xl font-black text-white font-mono tracking-tighter">
                {pelada.placar_casa || 0} <span className="text-zinc-700 mx-2">VS</span> {pelada.placar_visitante || 0}
              </div>
            </div>
            
            <div className="flex-1 flex flex-col items-center">
               <div className="text-xs font-black text-zinc-400 mb-1 uppercase tracking-widest">Tempo Decorrido</div>
               <div className="text-2xl font-black text-white font-mono">{Math.floor((pelada.cronometro_segundos || 0) / 60).toString().padStart(2, '0')}:{((pelada.cronometro_segundos || 0) % 60).toString().padStart(2, '0')}</div>
            </div>

            <button 
              onClick={() => navigate(`/peladas/${id}/live`)}
              className="group flex items-center gap-3 bg-white/5 border border-white/10 hover:bg-white/10 px-6 py-3 rounded-xl transition-all"
            >
              <span className="text-xs font-black text-white uppercase tracking-widest">Ver Painel Completo</span>
              <Play className="w-4 h-4 text-green-500 fill-current group-hover:scale-125 transition-transform" />
            </button>
          </div>
        </div>
      )}

      {/* Tabs Navigation */}
      <div className="flex flex-wrap gap-2 p-1 bg-zinc-100 dark:bg-zinc-800/50 rounded-2xl w-fit">
        {(pelada.status === 'finalizada' || pelada.status === 'encerrada') && (
          <button 
            onClick={() => setActiveTab('resumo')}
            className={cn(
              "px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all",
              activeTab === 'resumo' ? "bg-white dark:bg-zinc-900 shadow-sm text-app-text" : "text-app-text-muted hover:text-app-text"
            )}
          >
            Súmula / Resumo
          </button>
        )}
        <button 
          onClick={() => setActiveTab('inscritos')}
          className={cn(
            "px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all",
            activeTab === 'inscritos' ? "bg-white dark:bg-zinc-900 shadow-sm text-app-text" : "text-app-text-muted hover:text-app-text"
          )}
        >
          Inscritos
        </button>
        {canSeeFinance && (
          <button 
            onClick={() => setActiveTab('pagamentos')}
            className={cn(
              "px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all",
              activeTab === 'pagamentos' ? "bg-white dark:bg-zinc-900 shadow-sm text-app-text" : "text-app-text-muted hover:text-app-text"
            )}
          >
            Pagamentos
          </button>
        )}
        <button 
          onClick={() => setActiveTab('config')}
          className={cn(
            "px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all",
            activeTab === 'config' ? "bg-white dark:bg-zinc-900 shadow-sm text-app-text" : "text-app-text-muted hover:text-app-text"
          )}
        >
          Configurações
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          {activeTab === 'resumo' && (
            <div className="space-y-6">
              {/* Resultado final card */}
              <div className="bg-zinc-950 rounded-[2.5rem] border border-zinc-800 p-8 sm:p-12 text-center relative overflow-hidden shadow-2xl">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full bg-green-500/5 blur-[120px] pointer-events-none"></div>
                <div className="relative z-10">
                  <div className="text-zinc-500 text-[10px] font-black uppercase tracking-[0.4em] mb-6">Resultado do Jogo</div>
                  <div className="flex flex-col sm:flex-row items-center justify-center gap-6 sm:gap-16">
                    <div className="text-center min-w-[140px]">
                      <div className={cn(
                        "text-[10px] font-black px-4 py-1.5 rounded-full mb-3 uppercase tracking-widest border shadow-md inline-block",
                        getColeteStyle(pelada.colete_cor_1, 0).bg
                      )}>
                        {pelada.times?.[0]?.nome_time || "TIME CASA"}
                      </div>
                      <div className="text-6xl sm:text-7xl font-black text-white font-mono tracking-tighter">
                        {pelada.placar_casa || 0}
                      </div>
                    </div>
                    
                    <div className="text-3xl font-black text-zinc-800 italic transform -rotate-12 select-none border-x border-zinc-900 px-6 py-2">
                      VS
                    </div>

                    <div className="text-center min-w-[140px]">
                      <div className={cn(
                        "text-[10px] font-black px-4 py-1.5 rounded-full mb-3 uppercase tracking-widest border shadow-md inline-block",
                        getColeteStyle(pelada.colete_cor_2, 1).bg
                      )}>
                        {pelada.times?.[1]?.nome_time || "TIME VISITANTE"}
                      </div>
                      <div className="text-6xl sm:text-7xl font-black text-white font-mono tracking-tighter">
                        {pelada.placar_visitante || 0}
                      </div>
                    </div>
                  </div>

                  {/* Winner Banner */}
                  <div className="mt-8 pt-6 border-t border-zinc-900 flex justify-center">
                    {(() => {
                      const casa = pelada.placar_casa || 0;
                      const visit = pelada.placar_visitante || 0;
                      if (casa > visit) {
                        return (
                          <div className="inline-flex items-center gap-2 bg-green-500/10 text-green-500 border border-green-500/20 px-5 py-2 rounded-2xl text-xs font-black uppercase tracking-widest">
                            <Trophy className="w-4 h-4 text-yellow-500 fill-current animate-bounce" />
                            Vitória do {pelada.times?.[0]?.nome_time || "Time Casa"}!
                          </div>
                        );
                      } else if (visit > casa) {
                        return (
                          <div className="inline-flex items-center gap-2 bg-green-500/10 text-green-500 border border-green-500/20 px-5 py-2 rounded-2xl text-xs font-black uppercase tracking-widest">
                            <Trophy className="w-4 h-4 text-yellow-500 fill-current animate-bounce" />
                            Vitória do {pelada.times?.[1]?.nome_time || "Time Visitante"}!
                          </div>
                        );
                      } else {
                        return (
                          <div className="inline-flex items-center gap-2 bg-zinc-800 text-zinc-400 border border-zinc-700 px-5 py-2 rounded-2xl text-xs font-black uppercase tracking-widest">
                            <Plus className="w-4 h-4 rotate-45 text-zinc-500" />
                            Empate Técnico
                          </div>
                        );
                      }
                    })()}
                  </div>
                </div>
              </div>

              {/* Stats Bento Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Artilharia Card */}
                <div className="bg-app-card rounded-[2rem] border border-app-border p-6 shadow-xl space-y-4">
                  <h3 className="text-xs font-black text-app-text-muted uppercase tracking-[0.25em] border-b border-app-border pb-3 flex items-center">
                    <Trophy className="w-3.5 h-3.5 mr-2 text-yellow-500" /> Artilharia da Pelada
                  </h3>
                  <div className="space-y-2">
                    {(() => {
                      const eventos = pelada.eventos || [];
                      const goals = Array.from(new Set(eventos.filter(e => e.tipo === 'gol').map(e => e.jogador_id)))
                        .map(jid => ({
                          id: jid,
                          nome: eventos.find(e => e.jogador_id === jid)?.jogador_nome || "Simulado",
                          gols: eventos.filter(e => e.jogador_id === jid && e.tipo === 'gol').length
                        }))
                        .sort((a, b) => b.gols - a.gols);

                      if (goals.length === 0) {
                        return <p className="text-xs text-app-text-muted italic opacity-50 py-4 text-center">Nenhum gol registrado nesta partida.</p>;
                      }

                      return goals.map((art, idx) => (
                        <div key={art.id || `art-${idx}`} className="flex justify-between items-center bg-app-bg/50 p-4 rounded-2xl border border-app-border hover:border-zinc-700 transition">
                          <div className="flex items-center gap-3">
                            <span className="text-xs font-black text-zinc-500 font-mono italic">#{idx + 1}</span>
                            <button 
                              onClick={() => {
                                if (art.id) navigate(`/players/${art.id}`);
                              }}
                              className="font-black text-app-text uppercase tracking-tight text-xs hover:text-green-500 hover:underline text-left"
                            >
                              {art.nome}
                            </button>
                          </div>
                          <span className="bg-green-500/10 text-green-500 border border-green-500/20 px-3 py-1 rounded-full text-[10px] font-black">
                            {art.gols === 1 ? '1 GOL' : `${art.gols} GOLS`}
                          </span>
                        </div>
                      ));
                    })()}
                  </div>
                </div>

                {/* Garçons Card */}
                <div className="bg-app-card rounded-[2rem] border border-app-border p-6 shadow-xl space-y-4">
                  <h3 className="text-xs font-black text-app-text-muted uppercase tracking-[0.25em] border-b border-app-border pb-3 flex items-center">
                    <Handshake className="w-3.5 h-3.5 mr-2 text-blue-400" /> Garçons (Assistências)
                  </h3>
                  <div className="space-y-2">
                    {(() => {
                      const eventos = pelada.eventos || [];
                      const garcons = Array.from(new Set(eventos.filter(e => e.assistencia_nome).map(e => e.assistencia_nome)))
                        .map(anome => {
                          const matchingId = pelada.inscritos?.find(i => i.jogador_nome === anome)?.jogador;
                          return {
                            id: matchingId,
                            nome: anome,
                            assis: eventos.filter(e => e.assistencia_nome === anome).length
                          };
                        })
                        .sort((a, b) => b.assis - a.assis);

                      if (garcons.length === 0) {
                        return <p className="text-xs text-app-text-muted italic opacity-50 py-4 text-center">Nenhuma assistência registrada nesta partida.</p>;
                      }

                      return garcons.map((gar, idx) => (
                        <div key={gar.nome || `gar-${idx}`} className="flex justify-between items-center bg-app-bg/50 p-4 rounded-2xl border border-app-border hover:border-zinc-700 transition">
                          <div className="flex items-center gap-3">
                            <span className="text-xs font-black text-zinc-500 font-mono italic">#{idx + 1}</span>
                            {gar.id ? (
                              <button 
                                onClick={() => navigate(`/players/${gar.id}`)}
                                className="font-black text-app-text uppercase tracking-tight text-xs hover:text-green-500 hover:underline text-left font-sans"
                              >
                                {gar.nome}
                              </button>
                            ) : (
                              <span className="font-black text-app-text uppercase tracking-tight text-xs font-sans">{gar.nome}</span>
                            )}
                          </div>
                          <span className="bg-blue-500/10 text-blue-500 border border-blue-500/20 px-3 py-1 rounded-full text-[10px] font-black">
                            {gar.assis === 1 ? '1 ASSIST' : `${gar.assis} ASSIST`}
                          </span>
                        </div>
                      ));
                    })()}
                  </div>
                </div>
              </div>

              {/* Timeline / Linha do Tempo */}
              <div className="bg-app-card rounded-[2rem] border border-app-border p-8 shadow-xl space-y-6">
                <div>
                  <h3 className="text-xs font-black text-app-text-muted uppercase tracking-[0.25em] border-b border-app-border pb-3 flex items-center">
                    <Activity className="w-3.5 h-3.5 mr-2 text-green-500" /> Linha do Tempo da Partida
                  </h3>
                </div>

                <div className="relative border-l-2 border-app-border pl-6 ml-4 space-y-8 py-2">
                  {(() => {
                    const eventos = [...(pelada.eventos || [])].sort((a, b) => (a.minuto || 0) - (b.minuto || 0));
                    if (eventos.length === 0) {
                      return <p className="text-xs text-app-text-muted italic opacity-50 py-4">Nenhum evento registrado no cronômetro da pelada.</p>;
                    }

                    return eventos.map((ev, idx) => {
                      let title = "";
                      let desc = "";
                      let iconColor = "bg-green-500 text-white";
                      let iconSymbol = "⚽";

                      if (ev.tipo === 'gol') {
                        title = `GOL! - ${ev.jogador_nome}`;
                        desc = ev.assistencia_nome ? `Assistência de ${ev.assistencia_nome}` : 'Gol individual';
                        iconColor = "bg-green-500 text-white shadow-lg shadow-green-500/20";
                        iconSymbol = "⚽";
                      } else if (ev.tipo === 'cartao_amarelo') {
                        title = `Cartão Amarelo`;
                        desc = `Advertência para ${ev.jogador_nome}`;
                        iconColor = "bg-yellow-400 text-zinc-950 shadow-lg shadow-yellow-500/20";
                        iconSymbol = "🟨";
                      } else if (ev.tipo === 'cartao_vermelho') {
                        title = `Cartão Vermelho`;
                        desc = `Expulsão para ${ev.jogador_nome}`;
                        iconColor = "bg-red-500 text-white shadow-lg shadow-red-500/20";
                        iconSymbol = "🟥";
                      }

                      return (
                        <div key={ev.id || `ev-${idx}`} className="relative group">
                          {/* Circle on timeline */}
                          <div className={`absolute -left-[35px] top-1.5 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold border-2 border-app-card ${iconColor}`}>
                            <span className="text-[10px] leading-none mb-[1px]">{iconSymbol}</span>
                          </div>

                          <div className="bg-app-bg p-4 rounded-2xl border border-app-border group-hover:border-zinc-700 transition">
                            <div className="flex justify-between items-start gap-4">
                              <div>
                                <h4 className="font-black text-app-text uppercase tracking-tight text-xs">{title}</h4>
                                <p className="text-xs text-app-text-muted mt-1">{desc}</p>
                              </div>
                              <span className="text-[10px] font-black font-mono text-zinc-500 bg-zinc-100 dark:bg-zinc-800 px-2 py-1 rounded-lg">
                                {ev.minuto || 0}' MIN
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    });
                  })()}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'inscritos' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between px-2">
                <h2 className="text-xl font-black text-app-text flex items-center uppercase tracking-tighter">
                  <Users className="w-6 h-6 mr-3 text-green-500" />
                  Lista de Presença ({pelada.inscritos?.length || 0})
                </h2>
                <button 
                  onClick={() => setIsAddModalOpen(true)}
                  className="bg-green-600/10 text-green-600 text-xs font-black px-4 py-2 rounded-xl hover:bg-green-600 hover:text-white transition uppercase tracking-widest border border-green-500/20"
                >
                  <Plus className="w-4 h-4 mr-1 inline" />
                  Adicionar Jogador
                </button>
              </div>

              <div className="bg-app-card rounded-[2rem] border border-app-border overflow-hidden shadow-xl">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-app-border">
                    <thead className="bg-zinc-50 dark:bg-zinc-900">
                      <tr>
                        <th className="px-8 py-5 text-left font-black text-app-text-muted uppercase tracking-widest text-[10px]">#</th>
                        <th className="px-8 py-5 text-left font-black text-app-text-muted uppercase tracking-widest text-[10px]">Jogador</th>
                        <th className="px-8 py-5 text-center font-black text-app-text-muted uppercase tracking-widest text-[10px]">Confirmado</th>
                        {isOrganizador && <th className="px-8 py-5 text-right font-black text-app-text-muted uppercase tracking-widest text-[10px]">Ações</th>}
                      </tr>
                    </thead>
                    <tbody className="bg-app-card divide-y divide-app-border/40">
                      {[...(pelada.inscritos || [])]
                        .sort((a, b) => a.ordem_chegada - b.ordem_chegada)
                        .map((pj, index) => (
                        <tr 
                          key={pj.id} 
                          draggable={isOrganizador}
                          onDragStart={(e) => {
                            setDraggedIndex(index);
                            e.dataTransfer.effectAllowed = "move";
                          }}
                          onDragOver={(e) => {
                            e.preventDefault();
                            if (dragOverIndex !== index) {
                              setDragOverIndex(index);
                            }
                          }}
                          onDrop={(e) => {
                            e.preventDefault();
                            if (draggedIndex !== null && draggedIndex !== index) {
                              handleDragDrop(draggedIndex, index);
                            }
                            setDraggedIndex(null);
                            setDragOverIndex(null);
                          }}
                          onDragEnd={() => {
                            setDraggedIndex(null);
                            setDragOverIndex(null);
                          }}
                          className={cn(
                            "transition-all duration-150 relative",
                            !pj.presenca_confirmada ? "opacity-40 grayscale-[0.5]" : "",
                            draggedIndex === index ? "bg-green-600/5 opacity-30 select-none cursor-grabbing" : "hover:bg-zinc-50 dark:hover:bg-zinc-900/30",
                            dragOverIndex === index && draggedIndex !== index ? "border-t-4 border-t-green-500 bg-green-500/5" : ""
                          )}
                        >
                          <td className="px-8 py-5 whitespace-nowrap">
                            <div className="flex items-center gap-3">
                              {isOrganizador && (
                                <div 
                                  className="cursor-grab active:cursor-grabbing text-zinc-400 hover:text-green-500 p-1 rounded hover:bg-zinc-100 dark:hover:bg-zinc-800 transition select-none flex items-center justify-center"
                                  title="Arraste para reordenar"
                                >
                                  <GripVertical className="w-4 h-4 text-zinc-400" />
                                </div>
                              )}
                              <span className="text-xs font-black text-app-text-muted font-mono">{index + 1}º</span>
                            </div>
                          </td>
                          <td className="px-8 py-5 whitespace-nowrap">
                            <button 
                              onClick={() => {
                                if (pj.jogador) navigate(`/players/${pj.jogador}`);
                              }}
                              className="font-black text-app-text hover:text-green-500 hover:underline uppercase tracking-tight text-sm text-left block"
                            >
                              {pj.jogador_nome}
                            </button>
                            <div className="text-[10px] text-yellow-500 font-black tracking-widest uppercase">NÍVEL {(pj.jogador_nivel || 0).toFixed(1)} ★</div>
                          </td>
                          <td className="px-8 py-5 whitespace-nowrap text-center">
                            <button 
                              onClick={() => isOrganizador && handleTogglePresence(pj.id, pj.presenca_confirmada)} 
                              disabled={!isOrganizador}
                              className={cn(
                                "w-10 h-10 rounded-xl border-2 flex items-center justify-center transition-all shadow-sm",
                                pj.presenca_confirmada 
                                  ? "bg-green-500 border-green-600 text-white shadow-green-500/20" 
                                  : "border-app-border bg-app-bg text-transparent"
                              )}
                            >
                              <CheckCircle2 className="w-5 h-5" />
                            </button>
                          </td>
                          {isOrganizador && (
                            <td className="px-8 py-5 whitespace-nowrap text-right">
                              <button 
                                onClick={() => handleRemovePlayer(pj.id)}
                                className="p-2.5 text-red-500 hover:bg-red-500 hover:text-white rounded-xl transition-all border border-red-500/20 shadow-sm"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </td>
                          )}
                        </tr>
                      ))}
                      {(pelada.inscritos?.length || 0) === 0 && (
                        <tr>
                          <td colSpan={5} className="px-8 py-20 text-center">
                            <div className="text-app-text-muted italic font-serif opacity-40">Nenhum jogador na lista.</div>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'pagamentos' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between px-2">
                <h2 className="text-xl font-black text-app-text flex items-center uppercase tracking-tighter">
                  <DollarSign className="w-6 h-6 mr-3 text-blue-500" />
                  Controle de Pagamentos
                </h2>
                {isOrganizador && (
                  <div className="bg-blue-600/10 px-4 py-2 rounded-2xl border border-blue-500/20 flex items-center gap-3">
                    <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest whitespace-nowrap">Visível para visitantes</span>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input 
                        type="checkbox" 
                        className="sr-only peer"
                        checked={pelada.config_pagamento_visivel}
                        onChange={() => {
                          const newVal = !pelada.config_pagamento_visivel;
                          setPelada({...pelada, config_pagamento_visivel: newVal});
                          DataService.updatePelada(id!, { config_pagamento_visivel: newVal });
                        }}
                      />
                      <div className="w-11 h-6 bg-zinc-200 peer-focus:outline-none rounded-full peer dark:bg-zinc-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600 shadow-inner"></div>
                    </label>
                  </div>
                )}
              </div>

              <div className="bg-app-card rounded-[2rem] border border-app-border overflow-hidden shadow-xl">
                 <div className="overflow-x-auto">
                   <table className="min-w-full divide-y divide-app-border">
                     <thead className="bg-zinc-50 dark:bg-zinc-900">
                       <tr>
                         <th className="px-8 py-5 text-left font-black text-app-text-muted uppercase tracking-widest text-[10px]">Jogador</th>
                         <th className="px-8 py-5 text-center font-black text-app-text-muted uppercase tracking-widest text-[10px]">Status</th>
                         <th className="px-8 py-5 text-center font-black text-app-text-muted uppercase tracking-widest text-[10px]">Rateio</th>
                         {isOrganizador && <th className="px-8 py-5 text-right font-black text-app-text-muted uppercase tracking-widest text-[10px]">Confirmar</th>}
                       </tr>
                     </thead>
                     <tbody className="bg-app-card divide-y divide-app-border/40">
                       {(pelada.inscritos || [])
                         .filter(pj => pj.presenca_confirmada)
                         .sort((a, b) => (a.jogador_nome || "").localeCompare(b.jogador_nome || ""))
                         .map(pj => (
                         <tr key={pj.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-900/30 transition-colors">
                            <td className="px-8 py-5 whitespace-nowrap">
                              <div className="font-black text-app-text uppercase tracking-tight text-sm">{pj.jogador_nome}</div>
                            </td>
                            <td className="px-8 py-5 whitespace-nowrap text-center">
                              <span className={cn(
                                "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest",
                                pj.pagamento_confirmado 
                                  ? "bg-green-500/10 text-green-500 border border-green-500/20" 
                                  : "bg-red-500/10 text-red-500 border border-red-500/20"
                              )}>
                                {pj.pagamento_confirmado ? "Pago" : "Pendente"}
                              </span>
                            </td>
                            <td className="px-8 py-5 whitespace-nowrap text-center font-mono font-black text-xs text-app-text-muted">
                              R$ {(Number(pelada.valor_total || 0) / Math.max(1, (pelada.inscritos || []).filter(i => i.presenca_confirmada).length)).toFixed(2)}
                            </td>
                            {isOrganizador && (
                              <td className="px-8 py-5 whitespace-nowrap text-right">
                                <button 
                                  onClick={() => handleTogglePayment(pj.id, pj.pagamento_confirmado)}
                                  className={cn(
                                    "p-2.5 rounded-xl transition-all border shadow-sm",
                                    pj.pagamento_confirmado 
                                      ? "bg-red-500/10 text-red-500 border-red-500/20 hover:bg-red-500 hover:text-white"
                                      : "bg-green-600 text-white border-green-700 hover:bg-green-700"
                                  )}
                                >
                                  <DollarSign className="w-4 h-4" />
                                </button>
                              </td>
                            )}
                         </tr>
                       ))}
                       {(pelada.inscritos || []).filter(pj => pj.presenca_confirmada).length === 0 && (
                         <tr>
                            <td colSpan={4} className="px-8 py-20 text-center italic text-app-text-muted opacity-40 font-serif">Aguardando confirmações de presença para ratear o custo.</td>
                         </tr>
                       )}
                     </tbody>
                   </table>
                 </div>
              </div>
            </div>
          )}

          {activeTab === 'config' && (
            <div className="space-y-6">
               <h2 className="text-xl font-black text-app-text flex items-center uppercase tracking-tighter px-2">
                <RotateCcw className="w-6 h-6 mr-3 text-orange-500" />
                Configurações da Partida
              </h2>
              <div className="bg-app-card rounded-[2rem] border border-app-border p-8 shadow-xl space-y-8">
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-3">
                       <label className="text-xs font-black text-app-text-muted uppercase tracking-widest px-1">Título da Pelada</label>
                       <input 
                         type="text" 
                         className="w-full bg-app-bg border border-app-border rounded-2xl px-5 py-3 text-sm font-bold text-app-text focus:border-green-500 transition-all outline-none"
                         defaultValue={pelada.titulo}
                         onBlur={(e) => {
                           const newVal = e.target.value;
                           DataService.updatePelada(id!, { titulo: newVal });
                           toast.success("Título atualizado!");
                         }}
                       />
                    </div>
                    <div className="space-y-3">
                       <label className="text-xs font-black text-app-text-muted uppercase tracking-widest px-1">Local / Endereço</label>
                       <input 
                         type="text" 
                         className="w-full bg-app-bg border border-app-border rounded-2xl px-5 py-3 text-sm font-bold text-app-text focus:border-green-500 transition-all outline-none"
                         defaultValue={pelada.local}
                         onBlur={(e) => {
                           const newVal = e.target.value;
                           DataService.updatePelada(id!, { local: newVal });
                           toast.success("Local atualizado!");
                         }}
                       />
                    </div>
                    <div className="space-y-3">
                       <label className="text-xs font-black text-app-text-muted uppercase tracking-widest px-1">Jogadores por Time</label>
                       <select 
                         className="w-full bg-app-bg border border-app-border rounded-2xl px-5 py-3 text-sm font-bold text-app-text focus:border-green-500 transition-all outline-none"
                         defaultValue={pelada.jogadores_por_time}
                         onChange={(e) => {
                           const newVal = parseInt(e.target.value);
                           DataService.updatePelada(id!, { jogadores_por_time: newVal });
                           toast.success("Jogadores por time atualizado!");
                         }}
                       >
                         <option value={5}>5 x 5 (Futsal/Society)</option>
                         <option value={6}>6 x 6</option>
                         <option value={7}>7 x 7</option>
                         <option value={11}>11 x 11 (Campo)</option>
                       </select>
                    </div>
                    <div className="space-y-3">
                       <label className="text-xs font-black text-app-text-muted uppercase tracking-widest px-1">Duração da Partida (minutos)</label>
                       <input 
                         type="number" 
                         min={1}
                         className="w-full bg-app-bg border border-app-border rounded-2xl px-5 py-3 text-sm font-bold text-app-text focus:border-green-500 transition-all outline-none"
                         defaultValue={pelada.duracao_minutos ?? 10}
                         onBlur={(e) => {
                           const newVal = parseInt(e.target.value);
                           DataService.updatePelada(id!, { duracao_minutos: newVal });
                           toast.success("Duração atualizada!");
                         }}
                       />
                    </div>
                    <div className="space-y-3">
                       <label className="text-xs font-black text-app-text-muted uppercase tracking-widest px-1">Times Simultâneos</label>
                       <input 
                         type="number" 
                         min={2}
                         className="w-full bg-app-bg border border-app-border rounded-2xl px-5 py-3 text-sm font-bold text-app-text focus:border-green-500 transition-all outline-none"
                         defaultValue={pelada.times_simultaneos ?? 2}
                         onBlur={(e) => {
                           const newVal = parseInt(e.target.value);
                           DataService.updatePelada(id!, { times_simultaneos: newVal });
                           toast.success("Times simultâneos atualizados!");
                         }}
                       />
                    </div>
                    <div className="space-y-3">
                       <label className="text-xs font-black text-app-text-muted uppercase tracking-widest px-1">Valor por Jogador (R$)</label>
                       <input 
                         type="number" 
                         step="0.01"
                         min={0}
                         className="w-full bg-app-bg border border-app-border rounded-2xl px-5 py-3 text-sm font-bold text-app-text focus:border-green-500 transition-all outline-none"
                         defaultValue={pelada.valor_por_jogador ?? 0}
                         onBlur={(e) => {
                           const newVal = parseFloat(e.target.value);
                           DataService.updatePelada(id!, { valor_por_jogador: newVal });
                           toast.success("Valor por jogador atualizado!");
                         }}
                       />
                    </div>
                    <div className="space-y-3">
                       <label className="text-xs font-black text-app-text-muted uppercase tracking-widest px-1">Colete Time Casa</label>
                       <select 
                         className="w-full bg-app-bg border border-app-border rounded-2xl px-5 py-3 text-sm font-bold text-app-text focus:border-green-500 transition-all outline-none capitalize"
                         defaultValue={pelada.colete_cor_1 ?? "vermelho"}
                         onChange={(e) => {
                           const newVal = e.target.value;
                           DataService.updatePelada(id!, { colete_cor_1: newVal });
                           toast.success("Colete Time Casa atualizado!");
                         }}
                       >
                         <option value="vermelho">Vermelho</option>
                         <option value="azul">Azul</option>
                         <option value="verde">Verde</option>
                         <option value="amarelo">Amarelo</option>
                         <option value="laranja">Laranja</option>
                         <option value="roxo">Roxo</option>
                         <option value="rosa">Rosa</option>
                         <option value="preto">Preto</option>
                         <option value="branco">Branco</option>
                       </select>
                    </div>
                    <div className="space-y-3">
                       <label className="text-xs font-black text-app-text-muted uppercase tracking-widest px-1">Colete Time Visitante</label>
                       <select 
                         className="w-full bg-app-bg border border-app-border rounded-2xl px-5 py-3 text-sm font-bold text-app-text focus:border-green-500 transition-all outline-none capitalize"
                         defaultValue={pelada.colete_cor_2 ?? "azul"}
                         onChange={(e) => {
                           const newVal = e.target.value;
                           DataService.updatePelada(id!, { colete_cor_2: newVal });
                           toast.success("Colete Time Visitante atualizado!");
                         }}
                       >
                         <option value="vermelho">Vermelho</option>
                         <option value="azul">Azul</option>
                         <option value="verde">Verde</option>
                         <option value="amarelo">Amarelo</option>
                         <option value="laranja">Laranja</option>
                         <option value="roxo">Roxo</option>
                         <option value="rosa">Rosa</option>
                         <option value="preto">Preto</option>
                         <option value="branco">Branco</option>
                       </select>
                    </div>
                 </div>

                 <div className="pt-4 border-t border-app-border">
                   <h3 className="font-black text-app-text uppercase tracking-tight mb-4">Ações Perigosas</h3>
                   <div className="flex flex-wrap gap-4">
                     <button 
                       onClick={() => setShowDeleteConfirm(true)}
                       className="bg-red-500/10 text-red-500 border border-red-500/30 px-6 py-3 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-red-500 hover:text-white transition-all shadow-sm"
                     >
                       Excluir Pelada
                     </button>
                     {pelada.status !== 'encerrada' && pelada.status !== 'finalizada' && (
                       <button 
                         onClick={() => {
                           if (false) {
                             try {
                               DataService.finalizePelada(id!);
                               toast.success("Pelada finalizada com sucesso!");
                               fetchData();
                             } catch (error) {
                               toast.error("Erro ao finalizar pelada.");
                             }
                           }
                         }}
                         className="bg-zinc-900 border border-zinc-800 text-zinc-100 px-6 py-3 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-zinc-800 transition-all shadow-xl"
                       >
                         Finalizar Partida
                       </button>
                     )}
                   </div>
                 </div>
              </div>
            </div>
          )}
        </div>

        {/* Sidebar Summary */}
        <div className="space-y-6">
          <div className="bg-zinc-950 rounded-[2.5rem] border border-zinc-900 p-8 shadow-2xl relative overflow-hidden">
             <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-[60px] -mr-16 -mt-16"></div>
             <div className="relative z-10 space-y-6">
                <div>
                   <div className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] mb-4 text-center">Resumo Financeiro</div>
                   <div className="flex flex-col items-center gap-2">
                       <span className="text-[10px] font-black text-zinc-400">VALOR TOTAL</span>
                       <div className="flex items-center text-4xl font-black text-white tracking-tighter">
                         <span className="text-zinc-600 text-lg mr-1 font-mono">R$</span>
                         {isOrganizador ? (
                            <input 
                              type="number" 
                              className="bg-transparent border-none outline-none w-32 focus:ring-0 text-center"
                              defaultValue={pelada.valor_total || 0}
                              onBlur={(e) => {
                                const val = parseFloat(e.target.value);
                                DataService.updatePelada(id!, { valor_total: val });
                              }}
                            />
                         ) : (
                           Number(pelada.valor_total || 0).toFixed(2)
                         )}
                       </div>
                   </div>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-6 border-t border-zinc-800/50">
                   <div className="text-center">
                      <div className="text-xs font-black text-zinc-500 uppercase tracking-widest mb-1">Confirmados</div>
                      <div className="text-2xl font-black text-white font-mono">{(pelada.inscritos || []).filter(i => i.presenca_confirmada).length}</div>
                   </div>
                   <div className="text-center">
                      <div className="text-xs font-black text-zinc-500 uppercase tracking-widest mb-1">Por Pessoa</div>
                      <div className="text-2xl font-black text-blue-500 font-mono tracking-tight leading-none pt-1">
                        <span className="text-[10px] font-black block text-zinc-600 mb-1">R$</span>
                        {valorPorPessoa.toFixed(2)}
                      </div>
                   </div>
                </div>

                <div className="pt-2">
                   <div className="h-3 bg-zinc-900 rounded-full overflow-hidden border border-zinc-800 shadow-inner">
                      <div 
                        style={{ width: `${progressPercent}%` }}
                        className="h-full bg-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.3)]"
                      ></div>
                   </div>
                   <div className="flex justify-between mt-3">
                      <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Já pagaram</span>
                      <span className="text-[10px] font-black text-white bg-zinc-800 px-2 py-0.5 rounded-lg border border-zinc-700">
                        {(pelada.inscritos || []).filter(i => i.pagamento_confirmado).length} de {(pelada.inscritos || []).filter(i => i.presenca_confirmada).length}
                      </span>
                   </div>
                   <div className="text-center mt-6">
                      <div className="text-zinc-600 text-[10px] font-black uppercase tracking-widest mb-1">TOTAL ARRECADADO</div>
                      <div className="text-3xl font-black text-green-500 font-mono tracking-tighter">
                         R$ {valorArrecadado.toFixed(2)}
                      </div>
                   </div>
                </div>
             </div>
          </div>

          <div className="bg-app-card p-6 rounded-3xl border border-app-border shadow-md space-y-4">
             <h3 className="font-black text-app-text uppercase tracking-tight flex items-center gap-2">
               <Info className="w-4 h-4 text-app-text-muted" />
               Dica Pro
             </h3>
             <p className="text-xs text-app-text-muted italic leading-relaxed">
               Use o botão <span className="font-bold text-green-600">Sorteio Automático</span> no topo para equilibrar as estrelas e gerar times justos. 
               O rateio é calculado apenas com base nos jogadores que confirmaram presença.
             </p>
          </div>
        </div>
      </div>

      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-app-card rounded-2xl w-full max-w-md border border-app-border shadow-2xl overflow-hidden flex flex-col max-h-[80vh]">
            <div className="p-6 border-b border-app-border flex items-center justify-between">
              <h2 className="text-xl font-bold text-app-text">Adicionar à Lista</h2>
              <button onClick={() => setIsAddModalOpen(false)} className="p-2 text-app-text-muted hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"><X className="h-5 w-5" /></button>
            </div>
            <div className="p-4 bg-zinc-100 dark:bg-zinc-800/50 border-b border-app-border">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-app-text-muted" />
                <input 
                  type="text" 
                  className="w-full pl-10 pr-3 py-2 border border-app-border bg-app-bg rounded-lg text-sm text-app-text" 
                  placeholder="Buscar jogador..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-2">
              {filteredAvailable.map(player => (
                <div key={player.id} className="flex items-center justify-between p-3 rounded-xl border border-app-border hover:bg-zinc-100 dark:hover:bg-zinc-800 transition">
                  <div>
                    <div className="font-bold text-app-text">{player.nome}</div>
                    <div className="text-xs text-yellow-500 font-medium">{player.nivel_estrelas.toFixed(1)} ★</div>
                  </div>
                  <button 
                    onClick={() => handleAddPlayer(player.id)}
                    className="p-2 bg-green-500/10 text-green-500 rounded-lg hover:bg-green-500/20 transition"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              ))}
              {filteredAvailable.length === 0 && (
                <div className="text-center py-8 space-y-4">
                  <div className="text-app-text-muted text-sm font-serif italic">Nenhum jogador disponível.</div>
                  <button 
                    onClick={() => navigate("/players")}
                    className="bg-green-600 text-white px-4 py-2 rounded-lg text-xs font-bold hover:bg-green-700 transition"
                  >
                    Criar Novo Jogador
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-app-card rounded-2xl w-full max-w-sm border border-app-border shadow-2xl p-6 space-y-6">
            <div className="text-center space-y-2">
              <div className="w-12 h-12 bg-red-500/10 text-red-500 rounded-full flex items-center justify-center mx-auto">
                <X className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-black text-app-text uppercase tracking-tight">Excluir Pelada?</h3>
              <p className="text-sm text-app-text-muted">
                ATENÇÃO: Isso excluirá permanentemente esta pelada e todos os seus dados. Deseja continuar?
              </p>
            </div>
            <div className="flex gap-4">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 bg-zinc-100 dark:bg-zinc-800 text-app-text-muted py-3 rounded-xl font-bold text-sm tracking-wide hover:bg-zinc-200 dark:hover:bg-zinc-700 transition"
              >
                Cancelar
              </button>
              <button
                onClick={confirmDeletePelada}
                className="flex-1 bg-red-600 text-white py-3 rounded-xl font-bold text-sm tracking-wide hover:bg-red-700 transition"
              >
                Excluir
              </button>
            </div>
          </div>
        </div>
      )}

      {showFinalizeConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-app-card rounded-2xl w-full max-w-sm border border-app-border shadow-2xl p-6 space-y-6">
            <div className="text-center space-y-2">
              <div className="w-12 h-12 bg-yellow-500/10 text-yellow-500 rounded-full flex items-center justify-center mx-auto">
                <Clock className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-black text-app-text uppercase tracking-tight">Finalizar Partida?</h3>
              <p className="text-sm text-app-text-muted">
                Confirmar encerramento da pelada? Suas estatísticas serão salvas.
              </p>
            </div>
            <div className="flex gap-4">
              <button
                onClick={() => setShowFinalizeConfirm(false)}
                className="flex-1 bg-zinc-100 dark:bg-zinc-800 text-app-text-muted py-3 rounded-xl font-bold text-sm tracking-wide hover:bg-zinc-200 dark:hover:bg-zinc-700 transition"
              >
                Cancelar
              </button>
              <button
                onClick={confirmFinalizePelada}
                className="flex-1 bg-green-600 text-white py-3 rounded-xl font-bold text-sm tracking-wide hover:bg-green-700 transition"
              >
                Finalizar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PeladaDetail;
