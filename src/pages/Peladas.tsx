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
import DataService, { Pelada } from "../services/dataService";
import api from "../services/api";
import { cn } from "../lib/utils";

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
  const [duracaoMinutos, setDuracaoMinutos] = useState(10);
  const [timesSimultaneos, setTimesSimultaneos] = useState(2);
  const [valorPorJogador, setValorPorJogador] = useState("");
  const [coleteCor1, setColeteCor1] = useState("vermelho");
  const [coleteCor2, setColeteCor2] = useState("azul");

  useEffect(() => {
    fetchPeladas();
    
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "peladas") {
        fetchPeladas();
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const fetchPeladas = () => {
    setIsFetching(true);
    try {
      const locals = DataService.getPeladas();
      setPeladas(locals);
    } finally {
      setIsFetching(false);
    }
  };

  const handleCreatePelada = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    const newPelada: Partial<Pelada> = {
      titulo,
      data_hora: dataHora,
      local,
      jogadores_por_time: jogadoresPorTime,
      duracao_minutos: duracaoMinutos,
      times_simultaneos: timesSimultaneos,
      valor_por_jogador: valorPorJogador ? parseFloat(valorPorJogador) : 0,
      colete_cor_1: coleteCor1,
      colete_cor_2: coleteCor2,
    };

    try {
      DataService.savePelada(newPelada);
      toast.success("Pelada criada com sucesso!");
      fetchPeladas();
      setIsModalOpen(false);
      resetForm();
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setTitulo("");
    setDataHora("");
    setLocal("");
    setJogadoresPorTime(5);
    setDuracaoMinutos(10);
    setTimesSimultaneos(2);
    setValorPorJogador("");
    setColeteCor1("vermelho");
    setColeteCor2("azul");
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'agendada': return <span className="bg-blue-600/20 text-blue-400 px-2 py-0.5 rounded text-xs font-medium border border-blue-500/20">Agendada</span>;
      case 'em_andamento': return <span className="bg-green-600/20 text-green-400 px-2 py-0.5 rounded text-xs font-medium border border-green-500/20">Em Andamento</span>;
      case 'encerrada': return <span className="bg-zinc-800 text-zinc-400 px-2 py-0.5 rounded text-xs font-medium border border-zinc-700">Encerrada</span>;
      default: return null;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-app-text">Minhas Peladas</h1>
          <p className="text-app-text-muted">Organize seus confrontos e listas de presença.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-green-600 text-white px-4 py-2 rounded-lg flex items-center hover:bg-green-700 transition shadow-sm shadow-green-900/20"
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
              className="bg-app-card rounded-xl border border-app-border p-6 hover:border-zinc-300 dark:hover:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800/50 transition group"
            >
              <div className="flex justify-between items-start mb-4">
                <h3 className="font-bold text-lg text-app-text group-hover:text-green-500 transition truncate pr-2">
                  {pelada.titulo}
                </h3>
                {getStatusBadge(pelada.status)}
              </div>
              
              <div className="space-y-2 text-sm text-app-text-muted mb-6">
                <div className="flex items-center">
                  <Calendar className="w-4 h-4 mr-2 opacity-50" />
                  {pelada.data_hora ? new Date(pelada.data_hora).toLocaleString() : 'Não informada'}
                </div>
                <div className="flex items-center">
                  <MapPin className="w-4 h-4 mr-2 opacity-50" />
                  {pelada.local}
                </div>
                <div className="flex items-center">
                  <Users className="w-4 h-4 mr-2 opacity-50" />
                  {pelada.jogadores_por_time} vs {pelada.jogadores_por_time}
                </div>
              </div>

              <div className="flex items-center text-green-500 text-sm font-semibold">
                Ver Detalhes
                <ChevronRight className="w-4 h-4 ml-1" />
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="bg-app-card rounded-2xl border-2 border-dashed border-app-border p-12 text-center">
          <div className="bg-zinc-100 dark:bg-zinc-800 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
            <Calendar className="w-8 h-8 text-app-text-muted" />
          </div>
          <h3 className="text-lg font-semibold text-app-text mb-1">Nenhuma pelada marcada</h3>
          <p className="text-app-text-muted mb-6 font-serif italic text-sm">Clique no botão acima para agendar seu primeiro jogo.</p>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="text-green-500 font-semibold hover:underline"
          >
            Agendar agora
          </button>
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-app-card rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden border border-app-border flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-app-border flex items-center justify-between">
              <h2 className="text-xl font-bold text-app-text">Nova Pelada</h2>
              <button onClick={() => setIsModalOpen(false)} className="p-2 text-app-text-muted hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg"><X className="h-5 w-5" /></button>
            </div>
            <form onSubmit={handleCreatePelada} className="p-6 space-y-4 overflow-y-auto flex-1">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-app-text-muted mb-1">Título</label>
                  <input type="text" required className="w-full px-3 py-2 border border-app-border bg-app-bg rounded-lg text-app-text focus:ring-2 focus:ring-green-500" value={titulo} onChange={(e) => setTitulo(e.target.value)} placeholder="Ex: Pelada dos Amigos" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-app-text-muted mb-1">Data e Hora</label>
                  <input type="datetime-local" required className="w-full px-3 py-2 border border-app-border bg-app-bg rounded-lg text-app-text focus:ring-2 focus:ring-green-500" value={dataHora} onChange={(e) => setDataHora(e.target.value)} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-app-text-muted mb-1">Local</label>
                  <input type="text" required className="w-full px-3 py-2 border border-app-border bg-app-bg rounded-lg text-app-text focus:ring-2 focus:ring-green-500" value={local} onChange={(e) => setLocal(e.target.value)} placeholder="Ex: Arena Soccer" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-app-text-muted mb-1">Jogadores por Time</label>
                  <select className="w-full px-3 py-2 border border-app-border bg-app-bg rounded-lg text-app-text focus:ring-2 focus:ring-green-500" value={jogadoresPorTime} onChange={(e) => setJogadoresPorTime(parseInt(e.target.value))}>
                    <option value={5}>5 x 5 (Futsal/Society)</option>
                    <option value={6}>6 x 6</option>
                    <option value={7}>7 x 7</option>
                    <option value={11}>11 x 11 (Campo)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-app-text-muted mb-1">Duração da Partida (minutos)</label>
                  <input type="number" min={1} required className="w-full px-3 py-2 border border-app-border bg-app-bg rounded-lg text-app-text focus:ring-2 focus:ring-green-500" value={duracaoMinutos} onChange={(e) => setDuracaoMinutos(parseInt(e.target.value))} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-app-text-muted mb-1">Times Simultâneos</label>
                  <input type="number" min={2} required className="w-full px-3 py-2 border border-app-border bg-app-bg rounded-lg text-app-text focus:ring-2 focus:ring-green-500" value={timesSimultaneos} onChange={(e) => setTimesSimultaneos(parseInt(e.target.value))} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-app-text-muted mb-1">Valor por Jogador (R$ - opcional)</label>
                  <input type="number" step="0.01" min={0} className="w-full px-3 py-2 border border-app-border bg-app-bg rounded-lg text-app-text focus:ring-2 focus:ring-green-500" value={valorPorJogador} onChange={(e) => setValorPorJogador(e.target.value)} placeholder="Ex: 20.00" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-app-text-muted mb-1">Colete Time Casa</label>
                  <select className="w-full px-3 py-2 border border-app-border bg-app-bg rounded-lg text-app-text focus:ring-2 focus:ring-green-500 className capitalize" value={coleteCor1} onChange={(e) => setColeteCor1(e.target.value)}>
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
                <div>
                  <label className="block text-sm font-medium text-app-text-muted mb-1">Colete Time Visitante</label>
                  <select className="w-full px-3 py-2 border border-app-border bg-app-bg rounded-lg text-app-text focus:ring-2 focus:ring-green-500 className capitalize" value={coleteCor2} onChange={(e) => setColeteCor2(e.target.value)}>
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
              <div className="flex gap-3 pt-4 border-t border-app-border mt-4">
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 px-4 py-2 border border-app-border rounded-lg text-sm font-medium text-app-text-muted hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors">Cancelar</button>
                <button type="submit" disabled={isLoading} className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-50 transition-colors font-bold uppercase tracking-wider text-xs">
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
