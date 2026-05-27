import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd";
import { 
  ChevronLeft, 
  Shuffle, 
  GitCompare, 
  Save, 
  RotateCcw, 
  Loader2,
  Users,
  Star as StarIcon
} from "lucide-react";
import { toast } from "react-hot-toast";
import DataService, { Time, Pelada, COLETE_COLORS, getColeteStyle } from "../services/dataService";
import api from "../services/api";
import { cn } from "../lib/utils";
import socket from "../services/socket";

const PeladaSorteio = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [times, setTimes] = useState<Time[]>([]);
  const [history, setHistory] = useState<Time[][]>([]);
  const [pelada, setPelada] = useState<Pelada | null>(null);

  useEffect(() => {
    fetchTimes();
  }, [id]);

  const fetchTimes = () => {
    if (!id) return;
    setLoading(true);
    try {
      const p = DataService.getPeladaById(id);
      if (p) {
        setPelada(p);
        setTimes(p.times || []);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSorteio = (tipo: 'aleatorio' | 'balanceado') => {
    if (!id) return;
    setLoading(true);
    try {
      const updated = DataService.sortTeams(id, tipo);
      if (updated) {
        setPelada(updated);
        setTimes(updated.times || []);
        setHistory([]);
        toast.success(`Sorteio ${tipo} realizado!`);
      } else {
        toast.error("Nenhum jogador confirmado para o sorteio.");
      }
    } finally {
      setLoading(false);
    }
  };

  const onDragEnd = (result: DropResult) => {
    const { source, destination } = result;

    if (!destination) return;
    if (source.droppableId === destination.droppableId && source.index === destination.index) return;

    // Save current state to history
    setHistory(prev => [...prev, JSON.parse(JSON.stringify(times))]);

    const newTimes: Time[] = Array.from(times);
    const sourceTimeIndex = newTimes.findIndex(t => t.id === source.droppableId);
    const destTimeIndex = newTimes.findIndex(t => t.id === destination.droppableId);

    if (sourceTimeIndex === -1 || destTimeIndex === -1) return;

    const sourceTime = newTimes[sourceTimeIndex];
    const destTime = newTimes[destTimeIndex];

    const [movedPlayer] = sourceTime.jogadores.splice(source.index, 1);
    destTime.jogadores.splice(destination.index, 0, movedPlayer);

    // Recalculate sums
    sourceTime.soma_estrelas = sourceTime.jogadores.reduce((acc, j) => acc + j.jogador_nivel, 0);
    destTime.soma_estrelas = destTime.jogadores.reduce((acc, j) => acc + j.jogador_nivel, 0);

    setTimes(newTimes);
  };

  const handleUndo = () => {
    if (history.length === 0) return;
    const lastState = history[history.length - 1];
    setTimes(lastState);
    setHistory(prev => prev.slice(0, -1));
  };

  const handleConfirm = () => {
    if (!id) return;
    setSaving(true);
    try {
      // 1. Local Save (Critical for "Frontend-as-Backend")
      DataService.updateTeams(id, times);
      DataService.confirmTeams(id);
      
      toast.success("Times confirmados! Jogo iniciado.");
      navigate(`/peladas/${id}/live`);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center h-64 space-y-4">
        <Loader2 className="w-8 h-8 animate-spin text-green-600" />
        <p className="text-app-text-muted italic">Carregando times...</p>
      </div>
    );
  }

  if (!pelada) {
    return (
      <div className="flex flex-col items-center justify-center p-12 space-y-4">
        <div className="text-app-text-muted text-lg italic">Pelada não encontrada.</div>
        <button 
          onClick={() => navigate("/peladas")}
          className="bg-green-600 text-white px-6 py-2 rounded-xl font-bold hover:bg-green-700 transition"
        >
          Voltar para Peladas
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-20">
      <button 
        onClick={() => navigate(`/peladas/${id}`)}
        className="flex items-center text-app-text-muted hover:text-green-500 transition"
      >
        <ChevronLeft className="w-4 h-4 mr-1" />
        Voltar para Detalhes
      </button>

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-app-text uppercase tracking-tight">Sorteio de Times</h1>
          <p className="text-app-text-muted font-medium italic">{pelada?.titulo} • {times.length} times formados</p>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={() => handleSorteio('aleatorio')}
            className="flex items-center px-4 py-2 bg-zinc-100 dark:bg-zinc-800 text-app-text-muted rounded-lg hover:bg-zinc-200 dark:hover:bg-zinc-700 transition font-black uppercase tracking-widest text-[10px] border border-app-border"
          >
            <Shuffle className="w-3.5 h-3.5 mr-2" />
            Sorteio Aleatório
          </button>
          <button 
            onClick={() => handleSorteio('balanceado')}
            className="flex items-center px-4 py-2 bg-green-500/10 text-green-500 rounded-lg hover:bg-green-500/20 transition font-black uppercase tracking-widest text-[10px] border border-green-500/20"
          >
            <GitCompare className="w-3.5 h-3.5 mr-2" />
            Sorteio Balanceado
          </button>
        </div>
      </div>

      <DragDropContext onDragEnd={onDragEnd}>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {times.map((time, idx) => {
            const coleteStyle = getColeteStyle(time.colete, idx);
            return (
              <div key={time.id} className="flex flex-col space-y-3">
                <div className="flex justify-between items-center px-1">
                  <div className="flex items-center gap-2">
                    {/* Circle color indicator with native select overlay */}
                    <div className="relative w-5 h-5 flex items-center justify-center group">
                      <select
                        value={time.colete || ""}
                        onChange={(e) => {
                          const newColor = e.target.value;
                          const updatedTimes = times.map(t => t.id === time.id ? { ...t, colete: newColor } : t);
                          setTimes(updatedTimes);
                          if (id) {
                            DataService.updateTeamColete(id, time.id, newColor);
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
                      <span 
                        className={cn(
                          "w-4.5 h-4.5 rounded-full block border shadow-md transition-transform duration-250 group-hover:scale-120",
                          coleteStyle.bg,
                          coleteStyle.border,
                          coleteStyle.shadow
                        )}
                      ></span>
                    </div>

                    <h3 className="font-bold text-app-text flex items-center uppercase tracking-tighter">
                      {time.nome_time}
                      {idx >= 2 && <span className="ml-2 text-[10px] bg-zinc-100 dark:bg-zinc-800 text-app-text-muted px-1.5 py-0.5 rounded font-black uppercase tracking-widest border border-app-border">Próxima</span>}
                    </h3>
                  </div>
                <div className="text-sm font-black text-yellow-500 flex items-center">
                  <StarIcon className="w-3.5 h-3.5 mr-1 fill-yellow-500" />
                  {time.soma_estrelas.toFixed(1)}
                </div>
              </div>

              <Droppable droppableId={time.id}>
                {(provided, snapshot) => (
                  <div
                    {...provided.droppableProps}
                    ref={provided.innerRef}
                    className={cn(
                      "rounded-2xl border-2 border-dashed min-h-[220px] p-3 space-y-2 transition-all shadow-inner",
                      snapshot.isDraggingOver ? "bg-green-500/5 border-green-500/30" : "bg-app-card border-app-border"
                    )}
                  >
                    {time.jogadores.map((pj, index) => (
                      // @ts-ignore
                      <Draggable key={pj.id} draggableId={pj.id} index={index}>
                        {(provided: any, snapshot: any) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                            className={cn(
                              "p-3 rounded-xl border shadow-sm flex justify-between items-center transition-all",
                              snapshot.isDragging 
                                ? "shadow-2xl scale-105 bg-app-card border-blue-500 z-50 ring-2 ring-blue-500/20" 
                                : "bg-app-bg border-app-border hover:bg-zinc-100 dark:hover:bg-zinc-800/50"
                            )}
                          >
                            <div className="font-bold text-app-text uppercase tracking-tight text-sm">{pj.jogador_nome}</div>
                            <div className="text-[10px] font-black text-app-text-muted font-mono">{pj.jogador_nivel.toFixed(1)} ★</div>
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
              </div>
            );
          })}
          {times.length === 0 && (
              <div className="col-span-full py-20 text-center bg-app-card rounded-3xl border-2 border-dashed border-app-border">
                  <Users className="mx-auto h-12 w-12 text-app-text-muted opacity-20 mb-4" />
                  <p className="text-app-text-muted italic">Nenhum time ou jogador na lista. Clique em um botão de sorteio.</p>
              </div>
          )}
        </div>
      </DragDropContext>

      <div className="fixed bottom-0 left-0 right-0 bg-app-bg/80 backdrop-blur-md border-t border-app-border p-4 shadow-2xl flex justify-center z-40">
        <div className="max-w-4xl w-full flex justify-between items-center">
          <button 
            onClick={handleUndo}
            disabled={history.length === 0}
            className="flex items-center px-4 py-2 text-app-text-muted hover:text-app-text disabled:opacity-30 transition font-bold uppercase tracking-widest text-[10px]"
          >
            <RotateCcw className="w-4 h-4 mr-2" />
            Desfazer
          </button>
          
          <div className="flex gap-3">
             <button 
              onClick={() => navigate(`/peladas/${id}`)}
              className="px-6 py-2 border border-app-border bg-app-card text-app-text rounded-lg font-bold hover:bg-zinc-100 dark:hover:bg-zinc-800 transition shadow-sm uppercase tracking-widest text-[10px]"
            >
              Cancelar
            </button>
            <button 
              onClick={handleConfirm}
              disabled={saving || times.length === 0}
              className="px-8 py-2 bg-green-600 text-white rounded-lg font-black hover:bg-green-700 transition disabled:opacity-50 flex items-center shadow-lg shadow-green-900/20 uppercase tracking-widest text-[10px]"
            >
              {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
              Confirmar Times
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PeladaSorteio;
