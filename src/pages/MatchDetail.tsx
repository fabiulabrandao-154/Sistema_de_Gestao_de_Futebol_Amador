import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { 
  ArrowLeft, 
  Plus, 
  Search, 
  Check, 
  Trash2, 
  MoveUp, 
  MoveDown, 
  Play, 
  CheckCircle2,
  Users,
  Calendar,
  MapPin,
  Clock,
  Loader2,
  X,
  Star
} from "lucide-react";
import { toast } from "react-hot-toast";
import { cn } from "../lib/utils";
import api from "../services/api";
import socket from "../services/socket";

interface Match {
  id: string;
  title: string;
  date: string;
  time: string;
  location: string;
  duration: number;
  playersPerTeam: number;
  simultaneousTeams: number;
  status: "agendada" | "em_andamento" | "encerrada";
}

interface Player {
  id: string;
  name: string;
  level: number;
  active: boolean;
}

interface MatchPlayer {
  id: string;
  playerId: string;
  name: string;
  level: number;
  confirmed: boolean;
  paid: boolean;
  order: number;
}

const MatchDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [match, setMatch] = useState<Match | null>(null);
  const [matchPlayers, setMatchPlayers] = useState<MatchPlayer[]>([]);
  const [allPlayers, setAllPlayers] = useState<Player[]>([]);
  const [isAddPlayerModalOpen, setIsAddPlayerModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchData();

    socket.emit("join-match", id);
    socket.on("list-updated", () => {
      fetchMatchPlayers();
    });

    return () => {
      socket.off("list-updated");
    };
  }, [id]);

  const fetchData = async () => {
    try {
      const [matchRes, playersRes, matchPlayersRes] = await Promise.all([
        api.get(`/matches/${id}`),
        api.get("/players"),
        api.get(`/matches/${id}/players`),
      ]);
      setMatch(matchRes.data);
      setAllPlayers(playersRes.data);
      setMatchPlayers(matchPlayersRes.data);
    } catch (error) {
      toast.error("Erro ao carregar dados.");
      navigate("/matches");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchMatchPlayers = async () => {
    try {
      const response = await api.get(`/matches/${id}/players`);
      setMatchPlayers(response.data);
    } catch (error) {
      console.error("Erro ao atualizar lista via socket");
    }
  };

  const addPlayerToMatch = async (player: Player) => {
    if (matchPlayers.find((mp) => mp.playerId === player.id)) {
      toast.error("Jogador já está na lista!");
      return;
    }

    const newMatchPlayer = {
      playerId: player.id,
      name: player.name,
      level: player.level,
      confirmed: false,
      paid: false,
      order: matchPlayers.length + 1,
    };

    try {
      await api.post(`/matches/${id}/players`, newMatchPlayer);
      socket.emit("update-list", id);
      toast.success(`${player.name} adicionado à lista!`);
    } catch (error) {
      toast.error("Erro ao adicionar jogador.");
    }
  };

  const removePlayerFromMatch = async (matchPlayerId: string) => {
    const updatedPlayers = matchPlayers
      .filter((mp) => mp.id !== matchPlayerId)
      .map((mp, index) => ({ ...mp, order: index + 1 }));
    
    try {
      await api.put(`/matches/${id}/players`, updatedPlayers);
      socket.emit("update-list", id);
      toast.success("Jogador removido.");
    } catch (error) {
      toast.error("Erro ao remover jogador.");
    }
  };

  const toggleConfirmation = async (matchPlayerId: string) => {
    const updatedPlayers = matchPlayers.map((mp) =>
      mp.id === matchPlayerId ? { ...mp, confirmed: !mp.confirmed } : mp
    );
    
    try {
      await api.put(`/matches/${id}/players`, updatedPlayers);
      socket.emit("update-list", id);
    } catch (error) {
      toast.error("Erro ao confirmar presença.");
    }
  };

  const movePlayer = async (index: number, direction: "up" | "down") => {
    if (direction === "up" && index === 0) return;
    if (direction === "down" && index === matchPlayers.length - 1) return;

    const newPlayers = [...matchPlayers];
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    [newPlayers[index], newPlayers[targetIndex]] = [newPlayers[targetIndex], newPlayers[index]];
    
    const reorderedPlayers = newPlayers.map((mp, i) => ({ ...mp, order: i + 1 }));
    
    try {
      await api.put(`/matches/${id}/players`, reorderedPlayers);
      socket.emit("update-list", id);
    } catch (error) {
      toast.error("Erro ao reordenar.");
    }
  };

  const startMatch = async () => {
    if (matchPlayers.filter(p => p.confirmed).length < (match?.playersPerTeam || 0) * 2) {
      toast.error("Não há jogadores confirmados suficientes!");
      return;
    }
    
    try {
      await api.put(`/matches/${id}`, { status: "em_andamento" });
      setMatch({ ...match!, status: "em_andamento" });
      toast.success("Pelada iniciada!");
    } catch (error) {
      toast.error("Erro ao iniciar pelada.");
    }
  };

  const filteredPlayers = allPlayers.filter(
    (p) => p.active && p.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="animate-spin h-12 w-12 text-blue-600" />
      </div>
    );
  }

  if (!match) return null;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link to="/matches" className="p-2 hover:bg-gray-100 rounded-lg text-gray-500">
          <ArrowLeft className="h-6 w-6" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{match.title}</h1>
          <div className="flex flex-wrap gap-4 mt-1 text-sm text-gray-500">
            <span className="flex items-center"><Calendar className="h-4 w-4 mr-1" /> {new Date(match.date).toLocaleDateString()}</span>
            <span className="flex items-center"><Clock className="h-4 w-4 mr-1" /> {match.time}</span>
            <span className="flex items-center"><MapPin className="h-4 w-4 mr-1" /> {match.location}</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Match Info & Actions */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Configurações</h2>
            <div className="space-y-4">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Jogadores por time:</span>
                <span className="font-bold text-gray-900">{match.playersPerTeam}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Times simultâneos:</span>
                <span className="font-bold text-gray-900">{match.simultaneousTeams}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Total necessário:</span>
                <span className="font-bold text-blue-600">{match.playersPerTeam * 2} jogadores</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Confirmados:</span>
                <span className="font-bold text-green-600">{matchPlayers.filter(p => p.confirmed).length}</span>
              </div>
            </div>

            <div className="mt-8 space-y-3">
              {match.status === "agendada" && (
                <button
                  onClick={startMatch}
                  className="w-full flex items-center justify-center px-4 py-3 bg-green-600 text-white rounded-xl font-bold hover:bg-green-700 transition-colors shadow-sm"
                >
                  <Play className="h-5 w-5 mr-2" />
                  Iniciar Pelada
                </button>
              )}
              <button
                onClick={() => setIsAddPlayerModalOpen(true)}
                className="w-full flex items-center justify-center px-4 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-colors shadow-sm"
              >
                <Plus className="h-5 w-5 mr-2" />
                Adicionar Jogador
              </button>
            </div>
          </div>
        </div>

        {/* Players List */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-900 flex items-center">
                <Users className="mr-2 h-5 w-5 text-blue-600" />
                Lista de Inscritos
              </h2>
              <span className="text-sm text-gray-500">{matchPlayers.length} inscritos</span>
            </div>
            <div className="divide-y divide-gray-100">
              {matchPlayers.length > 0 ? (
                matchPlayers.map((mp, index) => (
                  <div key={mp.id} className={cn(
                    "flex items-center p-4 hover:bg-gray-50 transition-colors",
                    !mp.confirmed && "bg-gray-50/50"
                  )}>
                    <div className="w-8 text-sm font-bold text-gray-400">{mp.order}º</div>
                    <div className="flex-1 ml-2">
                      <div className="flex items-center">
                        <span className="text-sm font-bold text-gray-900">{mp.name}</span>
                        <span className="ml-2 text-xs font-medium text-yellow-600 bg-yellow-50 px-1.5 py-0.5 rounded flex items-center">
                          <Star className="h-3 w-3 fill-current mr-0.5" /> {mp.level.toFixed(1)}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => toggleConfirmation(mp.id)}
                        className={cn(
                          "p-2 rounded-lg transition-colors",
                          mp.confirmed ? "text-green-600 bg-green-50" : "text-gray-400 hover:bg-gray-100"
                        )}
                        title={mp.confirmed ? "Presença Confirmada" : "Confirmar Presença"}
                      >
                        <CheckCircle2 className="h-5 w-5" />
                      </button>
                      <div className="flex flex-col gap-1">
                        <button
                          onClick={() => movePlayer(index, "up")}
                          disabled={index === 0}
                          className="p-1 text-gray-400 hover:text-blue-600 disabled:opacity-30"
                        >
                          <MoveUp className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => movePlayer(index, "down")}
                          disabled={index === matchPlayers.length - 1}
                          className="p-1 text-gray-400 hover:text-blue-600 disabled:opacity-30"
                        >
                          <MoveDown className="h-4 w-4" />
                        </button>
                      </div>
                      <button
                        onClick={() => removePlayerFromMatch(mp.id)}
                        className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <Trash2 className="h-5 w-5" />
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-12 text-center text-gray-500">
                  Nenhum jogador na lista. Adicione jogadores para começar.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Add Player Modal */}
      {isAddPlayerModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-xl overflow-hidden max-h-[80vh] flex flex-col">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">Adicionar Jogador</h2>
              <button onClick={() => setIsAddPlayerModalOpen(false)} className="p-2 text-gray-400 hover:bg-gray-100 rounded-lg">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="p-4 border-b border-gray-100">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-sm"
                  placeholder="Buscar jogador..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            <div className="flex-1 overflow-y-auto divide-y divide-gray-100">
              {filteredPlayers.length > 0 ? (
                filteredPlayers.map((player) => {
                  const isAlreadyIn = matchPlayers.some(mp => mp.playerId === player.id);
                  return (
                    <div key={player.id} className="p-4 flex items-center justify-between hover:bg-gray-50">
                      <div>
                        <p className="text-sm font-bold text-gray-900">{player.name}</p>
                        <p className="text-xs text-gray-500 flex items-center">
                          <Star className="h-3 w-3 fill-current text-yellow-500 mr-1" /> {player.level.toFixed(1)}
                        </p>
                      </div>
                      <button
                        onClick={() => addPlayerToMatch(player)}
                        disabled={isAlreadyIn}
                        className={cn(
                          "px-3 py-1.5 rounded-lg text-xs font-bold transition-colors",
                          isAlreadyIn 
                            ? "bg-gray-100 text-gray-400 cursor-not-allowed" 
                            : "bg-blue-600 text-white hover:bg-blue-700"
                        )}
                      >
                        {isAlreadyIn ? "Já na lista" : "Adicionar"}
                      </button>
                    </div>
                  );
                })
              ) : (
                <div className="p-8 text-center text-gray-500 text-sm">
                  Nenhum jogador ativo encontrado.
                </div>
              )}
            </div>
            <div className="p-4 bg-gray-50 border-t border-gray-100">
              <button
                onClick={() => setIsAddPlayerModalOpen(false)}
                className="w-full py-2 text-sm font-medium text-gray-600 hover:text-gray-900"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MatchDetail;
