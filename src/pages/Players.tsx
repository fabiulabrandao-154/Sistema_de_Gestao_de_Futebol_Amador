import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { 
  Search, 
  Edit2, 
  Star, 
  UserPlus, 
  Loader2,
  X,
  UserX
} from "lucide-react";
import { toast } from "react-hot-toast";
import { cn } from "../lib/utils";
import api from "../services/api";

interface Player {
  id: string;
  nome: string;
  nivel_estrelas: number;
  ativo: boolean;
  data_cadastro?: string;
}

const Players = () => {
  const navigate = useNavigate();
  const [players, setPlayers] = useState<Player[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  const [editingPlayer, setEditingPlayer] = useState<Player | null>(null);

  // Form state
  const [name, setName] = useState("");
  const [nivel, setNivel] = useState(3.0);
  const [ativo, setAtivo] = useState(true);

  useEffect(() => {
    fetchPlayers();
  }, []);

  const fetchPlayers = async () => {
    try {
      const response = await api.get("/jogadores");
      const data = Array.isArray(response.data) ? response.data : [];
      setPlayers(data);
    } catch (error) {
      toast.error("Erro ao carregar jogadores.");
      setPlayers([]);
    } finally {
      setIsFetching(false);
    }
  };

  const handleSavePlayer = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const payload = { 
        nome: name, 
        nivel_estrelas: nivel, 
        ativo: ativo 
      };

      if (editingPlayer) {
        await api.put(`/jogadores/${editingPlayer.id}/`, payload);
        toast.success("Jogador atualizado!");
      } else {
        await api.post("/jogadores/", payload);
        toast.success("Jogador cadastrado!");
      }
      fetchPlayers();
      closeModal();
    } catch (error) {
      toast.error("Erro ao salvar jogador.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeletePlayer = async (id: string) => {
    if (!confirm("Deseja realmente desativar este jogador?")) return;
    try {
      await api.delete(`/jogadores/${id}/`);
      toast.success("Jogador desativado!");
      fetchPlayers();
    } catch (error) {
      toast.error("Erro ao desativar jogador.");
    }
  };

  const openModal = (player?: Player) => {
    if (player) {
      setEditingPlayer(player);
      setName(player.nome);
      setNivel(player.nivel_estrelas);
      setAtivo(player.ativo);
    } else {
      setEditingPlayer(null);
      setName("");
      setNivel(3.0);
      setAtivo(true);
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingPlayer(null);
  };

  const filteredPlayers = players.filter((p) =>
    p.nome.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Meus Jogadores</h1>
          <p className="text-gray-600">Gerencie seu banco de talentos para as peladas.</p>
        </div>
        <button
          onClick={() => openModal()}
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-lg text-sm font-medium text-white bg-green-600 hover:bg-green-700 transition-colors shadow-sm"
        >
          <UserPlus className="mr-2 h-4 w-4" />
          Novo Jogador
        </button>
      </div>

      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-green-500 focus:border-green-500 text-sm"
            placeholder="Buscar por nome..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Jogador</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nível</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Ações</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {isFetching ? (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-gray-500">
                    <Loader2 className="animate-spin h-8 w-8 mx-auto text-green-600" />
                  </td>
                </tr>
              ) : filteredPlayers.length > 0 ? (
                filteredPlayers.map((player) => (
                  <tr key={player.id} className={cn("hover:bg-gray-50 transition-colors", !player.ativo && "opacity-50")}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center text-green-700 font-bold">
                          {player.nome.charAt(0).toUpperCase()}
                        </div>
                        <div className="ml-4">
                          <div 
                            onClick={() => navigate(`/players/${player.id}`)}
                            className="text-sm font-medium text-gray-900 cursor-pointer hover:text-blue-600 transition-colors"
                          >
                            {player.nome}
                          </div>
                          {player.data_cadastro && (
                            <div className="text-xs text-gray-500">Cadastrado em {new Date(player.data_cadastro).toLocaleDateString()}</div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center text-yellow-500">
                        <Star className="h-4 w-4 fill-current mr-1" />
                        <span className="text-sm font-semibold">{player.nivel_estrelas.toFixed(1)}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={cn(
                        "px-2 inline-flex text-xs leading-5 font-semibold rounded-full",
                        player.ativo ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                      )}>
                        {player.ativo ? "Ativo" : "Inativo"}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button onClick={() => openModal(player)} className="text-blue-600 hover:text-blue-900 p-2">
                        <Edit2 className="h-4 w-4" />
                      </button>
                      <button onClick={() => handleDeletePlayer(player.id)} className="text-red-600 hover:text-red-900 p-2">
                        <UserX className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-gray-500">Nenhum jogador encontrado.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-xl overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">{editingPlayer ? "Editar Jogador" : "Novo Jogador"}</h2>
              <button onClick={closeModal} className="p-2 text-gray-400 hover:bg-gray-100 rounded-lg"><X className="h-5 w-5" /></button>
            </div>
            <form onSubmit={handleSavePlayer} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nome Completo</label>
                <input 
                  type="text" 
                  required 
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-green-500 focus:border-green-500" 
                  value={name} 
                  onChange={(e) => setName(e.target.value)} 
                  placeholder="Ex: Neymar Jr"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nível Técnico (Estrelas)</label>
                <div className="flex items-center gap-4">
                  <input 
                    type="range" 
                    min="0.5" 
                    max="5.0" 
                    step="0.5" 
                    className="flex-1 accent-green-600"
                    value={nivel} 
                    onChange={(e) => setNivel(parseFloat(e.target.value))} 
                  />
                  <div className="bg-green-50 text-green-700 font-bold px-3 py-1 rounded-lg border border-green-100">
                    {nivel.toFixed(1)} ★
                  </div>
                </div>
              </div>

              <div className="flex items-center py-2">
                <input 
                  type="checkbox" 
                  id="ativo" 
                  className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                  checked={ativo}
                  onChange={(e) => setAtivo(e.target.checked)}
                />
                <label htmlFor="ativo" className="ml-2 block text-sm text-gray-900">
                  Jogador Ativo (disponível para sorteio)
                </label>
              </div>

              <div className="flex gap-3 pt-4">
                <button type="button" onClick={closeModal} className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50">Cancelar</button>
                <button type="submit" disabled={isLoading} className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-50">
                  {isLoading ? <Loader2 className="animate-spin h-4 w-4 mx-auto" /> : "Salvar Jogador"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Players;
