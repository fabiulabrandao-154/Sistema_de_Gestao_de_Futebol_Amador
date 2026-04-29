import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { 
  ChevronLeft, 
  Plus, 
  Trash2, 
  CheckCircle2, 
  Circle, 
  ArrowUp, 
  ArrowDown,
  Users,
  Search,
  Loader2,
  X,
  Play,
  DollarSign
} from "lucide-react";
import { toast } from "react-hot-toast";
import api from "../services/api";
import { cn } from "../lib/utils";

import { useAuth } from "../context/AuthContext";

interface JogadorInscrito {
  id: string;
  jogador: string;
  jogador_nome: string;
  jogador_nivel: number;
  ordem_chegada: number;
  presenca_confirmada: boolean;
  pagamento_confirmado: boolean;
}

interface Pelada {
  id: string;
  titulo: string;
  data_hora: string;
  local: string;
  status: string;
  inscritos: JogadorInscrito[];
  valor_total?: number;
  config_pagamento_visivel?: boolean;
}

interface Player {
  id: string;
  nome: string;
  nivel_estrelas: number;
  ativo: boolean;
}

const PeladaDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [pelada, setPelada] = useState<Pelada | null>(null);
  const [availablePlayers, setAvailablePlayers] = useState<Player[]>([]);
  const [isFetching, setIsFetching] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const isOrganizador = user?.id === (pelada as any)?.organizador;
  const canSeeFinance = isOrganizador || pelada?.config_pagamento_visivel;

  useEffect(() => {
    fetchData();
  }, [id]);

  const fetchData = async () => {
    try {
      const [peladaRes, playersRes] = await Promise.all([
        api.get(`/peladas/${id}/`),
        api.get("/jogadores/")
      ]);
      setPelada(peladaRes.data);
      setAvailablePlayers(playersRes.data.filter((p: Player) => p.ativo));
    } catch (error) {
      toast.error("Erro ao carregar detalhes.");
      navigate("/peladas");
    } finally {
      setIsFetching(false);
    }
  };

  const handleAddPlayer = async (jogadorId: string) => {
    try {
      await api.post(`/peladas/${id}/jogadores/`, { jogador_id: jogadorId });
      toast.success("Jogador adicionado!");
      fetchData();
    } catch (error) {
      toast.error("Erro ao adicionar jogador.");
    }
  };

  const handleRemovePlayer = async (peladaJogadorId: string) => {
    try {
      await api.delete(`/pelada-jogadores/${peladaJogadorId}/`);
      toast.success("Jogador removido.");
      fetchData();
    } catch (error) {
      toast.error("Erro ao remover jogador.");
    }
  };

  const handleTogglePresence = async (peladaJogadorId: string, current: boolean) => {
    try {
      await api.patch(`/pelada-jogadores/${peladaJogadorId}/`, { 
        presenca_confirmada: !current 
      });
      fetchData();
    } catch (error) {
      toast.error("Erro ao atualizar presença.");
    }
  };

  const handleTogglePayment = async (peladaJogadorId: string, current: boolean) => {
    try {
      await api.patch(`/pelada-jogadores/${peladaJogadorId}/`, { 
        pagamento_confirmado: !current 
      });
      fetchData();
    } catch (error) {
      toast.error("Erro ao atualizar pagamento.");
    }
  };

  const movePlayer = async (index: number, direction: 'up' | 'down') => {
    if (!pelada) return;
    const newInscritos = [...pelada.inscritos];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    
    if (targetIndex < 0 || targetIndex >= newInscritos.length) return;
    
    const temp = newInscritos[index];
    newInscritos[index] = newInscritos[targetIndex];
    newInscritos[targetIndex] = temp;
    
    try {
      await api.put(`/peladas/${id}/jogadores/reordenar/`, { 
        ordem: newInscritos.map(pj => pj.jogador) 
      });
      fetchData();
    } catch (error) {
      toast.error("Erro ao reordenar.");
    }
  };

  const filteredAvailable = availablePlayers.filter(p => 
    p.nome.toLowerCase().includes(searchTerm.toLowerCase()) && 
    !pelada?.inscritos.some(i => i.jogador === p.id)
  );

  if (isFetching) {
    return (
      <div className="flex justify-center items-center h-full">
        <Loader2 className="w-8 h-8 animate-spin text-green-600" />
      </div>
    );
  }

  if (!pelada) return null;

  return (
    <div className="space-y-6">
      <button 
        onClick={() => navigate("/peladas")}
        className="flex items-center text-gray-600 hover:text-green-600 transition"
      >
        <ChevronLeft className="w-4 h-4 mr-1" />
        Voltar para Peladas
      </button>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{pelada.titulo}</h1>
            <p className="text-gray-600">{pelada.local} • {new Date(pelada.data_hora).toLocaleString()}</p>
          </div>
          <div className="flex gap-3">
            <button 
              onClick={() => navigate(`/peladas/${id}/sorteio`)}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center hover:bg-blue-700 transition font-semibold"
            >
              <Play className="w-4 h-4 mr-2" />
              Sorteio de Times
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-gray-900 flex items-center">
              <Users className="w-5 h-5 mr-2 text-green-600" />
              Lista de Inscritos ({pelada.inscritos.length})
            </h2>
            <button 
              onClick={() => setIsAddModalOpen(true)}
              className="text-green-600 text-sm font-semibold flex items-center hover:bg-green-50 px-3 py-1 rounded-lg transition"
            >
              <Plus className="w-4 h-4 mr-1" />
              Adicionar Jogador
            </button>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden text-sm">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-100">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left font-semibold text-gray-500 uppercase tracking-wider">#</th>
                    <th className="px-6 py-3 text-left font-semibold text-gray-500 uppercase tracking-wider">Jogador</th>
                    <th className="px-6 py-3 text-center font-semibold text-gray-500 uppercase tracking-wider">Presença</th>
                    {canSeeFinance && <th className="px-6 py-3 text-center font-semibold text-gray-500 uppercase tracking-wider">Pago</th>}
                    {isOrganizador && <th className="px-6 py-3 text-right font-semibold text-gray-500 uppercase tracking-wider">Ações</th>}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-100">
                  {pelada.inscritos.map((pj, index) => (
                    <tr key={pj.id} className={cn("hover:bg-gray-50 transition-colors", !pj.presenca_confirmada && "opacity-60")}>
                      <td className="px-6 py-4 whitespace-nowrap text-gray-400 font-mono">
                        {pj.ordem_chegada}º
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="font-semibold text-gray-900">{pj.jogador_nome}</div>
                        <div className="text-xs text-yellow-600 font-bold">{pj.jogador_nivel.toFixed(1)} ★</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <button onClick={() => isOrganizador && handleTogglePresence(pj.id, pj.presenca_confirmada)} disabled={!isOrganizador}>
                          {pj.presenca_confirmada ? (
                            <CheckCircle2 className="w-6 h-6 text-green-600 fill-green-50" />
                          ) : (
                            <Circle className="w-6 h-6 text-gray-300" />
                          )}
                        </button>
                      </td>
                      {canSeeFinance && (
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          <button onClick={() => isOrganizador && handleTogglePayment(pj.id, pj.pagamento_confirmado)} disabled={!isOrganizador}>
                            {pj.pagamento_confirmado ? (
                              <DollarSign className="w-6 h-6 text-blue-600" />
                            ) : (
                              <Circle className="w-6 h-6 text-gray-300" />
                            )}
                          </button>
                        </td>
                      )}
                      {isOrganizador && (
                        <td className="px-6 py-4 whitespace-nowrap text-right space-x-2">
                          <div className="inline-flex rounded-lg border border-gray-200 overflow-hidden mr-2">
                            <button 
                              disabled={index === 0}
                              onClick={() => movePlayer(index, 'up')}
                              className="p-1.5 hover:bg-gray-100 disabled:opacity-30 border-r border-gray-200"
                            >
                              <ArrowUp className="w-3.5 h-3.5 text-gray-600" />
                            </button>
                            <button 
                              disabled={index === pelada.inscritos.length - 1}
                              onClick={() => movePlayer(index, 'down')}
                              className="p-1.5 hover:bg-gray-100 disabled:opacity-30"
                            >
                              <ArrowDown className="w-3.5 h-3.5 text-gray-600" />
                            </button>
                          </div>
                          <button 
                            onClick={() => handleRemovePlayer(pj.id)}
                            className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      )}
                    </tr>
                  ))}
                  {pelada.inscritos.length === 0 && (
                    <tr>
                      <td colSpan={4} className="px-6 py-12 text-center text-gray-400">Nenhum jogador na lista.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <h2 className="text-lg font-bold text-gray-900">Configurações</h2>
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-4 text-sm">
            <div className="flex justify-between pb-3 border-b border-gray-50">
              <span className="text-gray-600">Jogadores p/ time</span>
              <span className="font-bold">5</span>
            </div>
            <div className="flex justify-between pb-3 border-b border-gray-50">
              <span className="text-gray-600">Mínimo p/ Jogo</span>
              <span className="font-bold">10</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Total Confirmado</span>
              <span className="font-bold text-green-600">{pelada.inscritos.filter(i => i.presenca_confirmada).length}</span>
            </div>
          </div>

          {canSeeFinance && (
            <>
              <h2 className="text-lg font-bold text-gray-900 pt-6 flex items-center justify-between">
                Rateio de Custos
                {isOrganizador && (
                  <label className="flex items-center cursor-pointer scale-75">
                    <span className="mr-2 text-xs text-gray-500 font-bold uppercase tracking-widest whitespace-nowrap">Visível p/ Visitantes</span>
                    <div className="relative">
                      <input 
                        type="checkbox" 
                        className="sr-only"
                        checked={pelada.config_pagamento_visivel}
                        onChange={async () => {
                          await api.put(`/peladas/${id}/`, { config_pagamento_visivel: !pelada.config_pagamento_visivel });
                          fetchData();
                        }}
                      />
                      <div className={cn("block w-10 h-6 rounded-full transition-colors", pelada.config_pagamento_visivel ? "bg-green-500" : "bg-gray-300")}></div>
                      <div className={cn("absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform", pelada.config_pagamento_visivel && "translate-x-4")}></div>
                    </div>
                  </label>
                )}
              </h2>
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-4 text-sm">
                <div className="flex justify-between pb-3 border-b border-gray-50">
                  <span className="text-gray-600">Custo Total</span>
                  <span className="font-bold whitespace-nowrap">
                    R$ {isOrganizador ? (
                      <input 
                        type="number" 
                        className="w-20 border rounded px-1 ml-1 text-right"
                        defaultValue={Number(pelada.valor_total || 0)}
                        onBlur={async (e) => {
                          const val = parseFloat(e.target.value);
                          await api.put(`/peladas/${id}/`, { valor_total: val });
                          fetchData();
                        }}
                      />
                    ) : (
                      Number(pelada.valor_total || 0).toFixed(2)
                    )}
                  </span>
                </div>
                <div className="flex justify-between pb-3 border-b border-gray-50">
                  <span className="text-gray-600">Confirmados</span>
                  <span className="font-bold">{pelada.inscritos.filter(i => i.presenca_confirmada).length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Por Pessoa</span>
                  <span className="font-bold text-blue-600 text-lg">
                    R$ {(Number(pelada.valor_total || 0) / Math.max(1, pelada.inscritos.filter(i => i.presenca_confirmada).length)).toFixed(2)}
                  </span>
                </div>
                <div className="pt-2">
                   <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div 
                        style={{ width: `${(pelada.inscritos.filter(i => i.pagamento_confirmado).length / Math.max(1, pelada.inscritos.filter(i => i.presenca_confirmada).length)) * 100}%` }}
                        className="h-full bg-blue-500"
                      ></div>
                   </div>
                   <div className="flex justify-between mt-1 text-[10px] font-bold text-gray-400 uppercase">
                      <span>Arrecadado</span>
                      <span>{pelada.inscritos.filter(i => i.pagamento_confirmado).length} de {pelada.inscritos.filter(i => i.presenca_confirmada).length}</span>
                   </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-xl overflow-hidden flex flex-col max-h-[80vh]">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">Adicionar à Lista</h2>
              <button onClick={() => setIsAddModalOpen(false)} className="p-2 text-gray-400 hover:bg-gray-100 rounded-lg"><X className="h-5 w-5" /></button>
            </div>
            <div className="p-4 bg-gray-50 border-b border-gray-100">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input 
                  type="text" 
                  className="w-full pl-10 pr-3 py-2 border border-gray-200 rounded-lg text-sm" 
                  placeholder="Buscar jogador..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-2">
              {filteredAvailable.map(player => (
                <div key={player.id} className="flex items-center justify-between p-3 rounded-xl border border-gray-100 hover:bg-gray-50 transition">
                  <div>
                    <div className="font-semibold text-gray-900">{player.nome}</div>
                    <div className="text-xs text-yellow-600">{player.nivel_estrelas.toFixed(1)} ★</div>
                  </div>
                  <button 
                    onClick={() => handleAddPlayer(player.id)}
                    className="p-2 bg-green-50 text-green-600 rounded-lg hover:bg-green-100 transition"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              ))}
              {filteredAvailable.length === 0 && (
                <div className="text-center py-8 text-gray-400 text-sm">Nenhum jogador disponível.</div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PeladaDetail;
