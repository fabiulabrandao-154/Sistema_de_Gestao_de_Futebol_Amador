import React, { useState, useEffect } from "react";
import { 
  Plus, 
  Search, 
  Calendar, 
  MapPin, 
  Users, 
  Clock, 
  ChevronRight,
  PlusCircle,
  Loader2,
  X
} from "lucide-react";
import { Link } from "react-router-dom";
import { toast } from "react-hot-toast";
import api from "../services/api";
import { cn } from "../lib/utils";

interface Pelada {
  id: string;
  titulo: string;
  data_hora: string;
  local: string;
  status: 'agendada' | 'em_andamento' | 'encerrada';
  jogadores_por_time: number;
}

const Peladas = () => {
  const [peladas, setPeladas] = useState<Pelada[]>([]);
  const [isFetching, setIsFetching] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Form state
  const [titulo, setTitulo] = useState("");
  const [dataHora, setDataHora] = useState("");
  const [local, setLocal] = useState("");
  const [jogadoresPorTime, setJogadoresPorTime] = useState(5);

  useEffect(() => {
    fetchPeladas();
  }, []);

  const fetchPeladas = async () => {
    try {
      const response = await api.get("/peladas/");
      const data = Array.isArray(response.data) ? response.data : [];
      setPeladas(data);
    } catch (error) {
      toast.error("Erro ao carregar peladas.");
      setPeladas([]);
    } finally {
      setIsFetching(false);
    }
  };

  const handleCreatePelada = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await api.post("/peladas/", {
        titulo,
        data_hora: dataHora,
        local,
        jogadores_por_time: jogadoresPorTime,
        times_simultaneos: 2,
        duracao_minutos: 60,
        status: 'agendada'
      });
      toast.success("Pelada criada!");
      fetchPeladas();
      setIsModalOpen(false);
      resetForm();
    } catch (error) {
      toast.error("Erro ao criar pelada.");
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setTitulo("");
    setDataHora("");
    setLocal("");
    setJogadoresPorTime(5);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'agendada': return <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded text-xs font-medium">Agendada</span>;
      case 'em_andamento': return <span className="bg-green-100 text-green-700 px-2 py-0.5 rounded text-xs font-medium">Em Andamento</span>;
      case 'encerrada': return <span className="bg-gray-100 text-gray-700 px-2 py-0.5 rounded text-xs font-medium">Encerrada</span>;
      default: return null;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Minhas Peladas</h1>
          <p className="text-gray-600">Organize seus confrontos e listas de presença.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-green-600 text-white px-4 py-2 rounded-lg flex items-center hover:bg-green-700 transition"
        >
          <Plus className="w-4 h-4 mr-2" />
          Nova Pelada
        </button>
      </div>

      {isFetching ? (
        <div className="flex justify-center p-12">
          <Loader2 className="w-8 h-8 animate-spin text-green-600" />
        </div>
      ) : peladas.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {peladas.map(pelada => (
            <Link 
              key={pelada.id} 
              to={`/peladas/${pelada.id}`}
              className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition group"
            >
              <div className="flex justify-between items-start mb-4">
                <h3 className="font-bold text-lg text-gray-900 group-hover:text-green-600 transition truncate pr-2">
                  {pelada.titulo}
                </h3>
                {getStatusBadge(pelada.status)}
              </div>
              
              <div className="space-y-2 text-sm text-gray-600 mb-6">
                <div className="flex items-center">
                  <Calendar className="w-4 h-4 mr-2 text-gray-400" />
                  {new Date(pelada.data_hora).toLocaleString()}
                </div>
                <div className="flex items-center">
                  <MapPin className="w-4 h-4 mr-2 text-gray-400" />
                  {pelada.local}
                </div>
                <div className="flex items-center">
                  <Users className="w-4 h-4 mr-2 text-gray-400" />
                  {pelada.jogadores_por_time} vs {pelada.jogadores_por_time}
                </div>
              </div>

              <div className="flex items-center text-green-600 text-sm font-semibold">
                Ver Detalhes
                <ChevronRight className="w-4 h-4 ml-1" />
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-2xl border-2 border-dashed border-gray-200 p-12 text-center">
          <div className="bg-gray-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
            <Calendar className="w-8 h-8 text-gray-300" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-1">Nenhuma pelada marcada</h3>
          <p className="text-gray-500 mb-6">Clique no botão acima para agendar seu primeiro jogo.</p>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="text-green-600 font-semibold hover:underline"
          >
            Agendar agora
          </button>
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-xl overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">Nova Pelada</h2>
              <button onClick={() => setIsModalOpen(false)} className="p-2 text-gray-400 hover:bg-gray-100 rounded-lg"><X className="h-5 w-5" /></button>
            </div>
            <form onSubmit={handleCreatePelada} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Título</label>
                <input type="text" required className="w-full px-3 py-2 border border-gray-300 rounded-lg" value={titulo} onChange={(e) => setTitulo(e.target.value)} placeholder="Ex: Pelada dos Amigos" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Data e Hora</label>
                <input type="datetime-local" required className="w-full px-3 py-2 border border-gray-300 rounded-lg" value={dataHora} onChange={(e) => setDataHora(e.target.value)} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Local</label>
                <input type="text" required className="w-full px-3 py-2 border border-gray-300 rounded-lg" value={local} onChange={(e) => setLocal(e.target.value)} placeholder="Ex: Arena Soccer" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Jogadores por Time</label>
                <select className="w-full px-3 py-2 border border-gray-300 rounded-lg" value={jogadoresPorTime} onChange={(e) => setJogadoresPorTime(parseInt(e.target.value))}>
                  <option value={5}>5 x 5 (Futsal/Society)</option>
                  <option value={6}>6 x 6</option>
                  <option value={7}>7 x 7</option>
                  <option value={11}>11 x 11 (Campo)</option>
                </select>
              </div>
              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700">Cancelar</button>
                <button type="submit" disabled={isLoading} className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-50">
                  {isLoading ? <Loader2 className="w-4 h-4 mx-auto animate-spin" /> : "Criar Pelada"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Peladas;
