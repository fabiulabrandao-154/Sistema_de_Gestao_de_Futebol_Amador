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
import api from "../services/api";
import { cn } from "../lib/utils";

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
}

const PeladaSorteio = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [times, setTimes] = useState<Time[]>([]);
  const [history, setHistory] = useState<Time[][]>([]);
  const [pelada, setPelada] = useState<any>(null);

  useEffect(() => {
    fetchTimes();
  }, [id]);

  const fetchTimes = async () => {
    try {
      const [peladaRes, timesRes] = await Promise.all([
        api.get(`/peladas/${id}/`),
        api.get(`/peladas/${id}/times/`)
      ]);
      setPelada(peladaRes.data);
      
      const mappedTimes = timesRes.data.map((t: any) => ({
        id: t.id.toString(),
        nome_time: t.nome_time,
        soma_estrelas: t.soma_estrelas,
        jogadores: t.jogadores.map((j: any) => ({
          id: j.jogador.toString(),
          jogador_nome: j.jogador_nome,
          jogador_nivel: j.jogador_nivel,
          jogador_id: j.jogador
        }))
      }));
      setTimes(mappedTimes);
    } catch (error) {
      toast.error("Erro ao carregar dados do sorteio.");
    } finally {
      setLoading(false);
    }
  };

  const handleSorteio = async (tipo: 'aleatorio' | 'balanceado') => {
    setLoading(true);
    try {
      const response = await api.post(`/peladas/${id}/sortear/?tipo=${tipo}`);
      // The backend returns the full pelada with nested times now or we fetch again
      fetchTimes();
      setHistory([]); // Reset history on new draw
      toast.success(`Sorteio ${tipo} realizado!`);
    } catch (error: any) {
      toast.error(error.response?.data?.error || "Erro ao realizar sorteio.");
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

  const handleConfirm = async () => {
    setSaving(true);
    try {
      const payload = {
        times: times.map(t => ({
          id: t.id,
          jogadores: t.jogadores.map(j => j.jogador_id)
        }))
      };
      await api.post(`/peladas/${id}/times/ajustar/`, payload);
      await api.post(`/peladas/${id}/times/confirmar/`);
      toast.success("Times confirmados! Jogo iniciado.");
      navigate(`/peladas/${id}/live`);
    } catch (error) {
      toast.error("Erro ao confirmar times.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-full">
        <Loader2 className="w-8 h-8 animate-spin text-green-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-20">
      <button 
        onClick={() => navigate(`/peladas/${id}`)}
        className="flex items-center text-gray-600 hover:text-green-600 transition"
      >
        <ChevronLeft className="w-4 h-4 mr-1" />
        Voltar para Detalhes
      </button>

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Sorteio de Times</h1>
          <p className="text-gray-600">{pelada?.titulo} • {times.length} times formados</p>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={() => handleSorteio('aleatorio')}
            className="flex items-center px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition font-medium"
          >
            <Shuffle className="w-4 h-4 mr-2" />
            Sorteio Aleatório
          </button>
          <button 
            onClick={() => handleSorteio('balanceado')}
            className="flex items-center px-4 py-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition font-medium"
          >
            <GitCompare className="w-4 h-4 mr-2" />
            Sorteio Balanceado
          </button>
        </div>
      </div>

      <DragDropContext onDragEnd={onDragEnd}>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {times.map((time, idx) => (
            <div key={time.id} className="flex flex-col space-y-3">
              <div className="flex justify-between items-center px-1">
                <h3 className="font-bold text-gray-900 flex items-center">
                  <span className={cn(
                    "w-3 h-3 rounded-full mr-2",
                    idx === 0 ? "bg-red-500" : idx === 1 ? "bg-blue-500" : "bg-gray-400"
                  )}></span>
                  {time.nome_time}
                  {idx >= 2 && <span className="ml-2 text-[10px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded uppercase tracking-wider">Próxima</span>}
                </h3>
                <div className="text-sm font-bold text-yellow-600 flex items-center">
                  <StarIcon className="w-3.5 h-3.5 mr-1 fill-yellow-600" />
                  {time.soma_estrelas.toFixed(1)}
                </div>
              </div>

              <Droppable droppableId={time.id}>
                {(provided, snapshot) => (
                  <div
                    {...provided.droppableProps}
                    ref={provided.innerRef}
                    className={cn(
                      "bg-white rounded-xl border-2 border-dashed min-h-[200px] p-2 space-y-2 transition-colors",
                      snapshot.isDraggingOver ? "bg-green-50 border-green-300" : "bg-gray-50 border-gray-100"
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
                              "bg-white p-3 rounded-lg border border-gray-100 shadow-sm flex justify-between items-center",
                              snapshot.isDragging ? "shadow-lg scale-105" : ""
                            )}
                          >
                            <div className="font-medium text-gray-900">{pj.jogador_nome}</div>
                            <div className="text-xs text-gray-400">{pj.jogador_nivel.toFixed(1)} ★</div>
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </div>
          ))}
        </div>
      </DragDropContext>

      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 p-4 shadow-xl flex justify-center">
        <div className="max-w-4xl w-full flex justify-between items-center">
          <button 
            onClick={handleUndo}
            disabled={history.length === 0}
            className="flex items-center px-4 py-2 text-gray-600 hover:text-gray-900 disabled:opacity-30 transition"
          >
            <RotateCcw className="w-4 h-4 mr-2" />
            Desfazer
          </button>
          
          <div className="flex gap-3">
             <button 
              onClick={() => navigate(`/peladas/${id}`)}
              className="px-6 py-2 border border-gray-300 rounded-lg font-semibold hover:bg-gray-50 transition"
            >
              Cancelar
            </button>
            <button 
              onClick={handleConfirm}
              disabled={saving || times.length === 0}
              className="px-8 py-2 bg-green-600 text-white rounded-lg font-bold hover:bg-green-700 transition disabled:opacity-50 flex items-center"
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
