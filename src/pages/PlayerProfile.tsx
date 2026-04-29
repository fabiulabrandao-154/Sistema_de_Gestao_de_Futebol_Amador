import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { cn } from "../lib/utils";
import { 
  ChevronLeft, 
  Loader2, 
  Trophy, 
  Target, 
  Handshake, 
  Percent,
  Star,
  Award,
  Zap,
  TrendingUp
} from "lucide-react";
import api from "../services/api";
import { toast } from "react-hot-toast";

interface Stats {
  total_jogos: number;
  total_gols: number;
  total_assistencias: number;
  total_vitorias: number;
  total_empates: number;
  total_derrotas: number;
  media_gols: number;
}

interface Player {
  id: string;
  nome: string;
  nivel_estrelas: number;
  estatisticas: Stats;
}

const PlayerProfile = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [player, setPlayer] = useState<Player | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPlayer();
  }, [id]);

  const fetchPlayer = async () => {
    try {
      const response = await api.get(`/jogadores/${id}/`);
      setPlayer(response.data);
    } catch (error) {
      toast.error("Erro ao carregar perfil do jogador.");
      // navigate("/players");
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="flex justify-center p-12"><Loader2 className="animate-spin" /></div>;
  if (!player) return <div className="p-12 text-center text-gray-500">Jogador não encontrado.</div>;

  const stats = player.estatisticas || {
    total_jogos: 0,
    total_gols: 0,
    total_assistencias: 0,
    total_vitorias: 0,
    total_empates: 0,
    total_derrotas: 0,
    media_gols: 0
  };

  const winRate = stats.total_jogos > 0 ? ((stats.total_vitorias / stats.total_jogos) * 100).toFixed(0) : 0;

  return (
    <div className="space-y-8 pb-20 max-w-4xl mx-auto">
      <button 
        onClick={() => navigate(-1)}
        className="flex items-center text-gray-600 hover:text-green-600 transition"
      >
        <ChevronLeft className="w-4 h-4 mr-1" /> Voltar
      </button>

      {/* Header Profile */}
      <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100 flex flex-col md:flex-row items-center gap-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-4 opacity-5">
           <Trophy className="w-32 h-32" />
        </div>
        
        <div className="w-32 h-32 bg-blue-50 rounded-full flex items-center justify-center text-blue-600 text-4xl font-bold border-4 border-white shadow-lg">
          {player.nome.charAt(0).toUpperCase()}
        </div>
        
        <div className="flex-1 text-center md:text-left">
          <h1 className="text-3xl font-black text-gray-900 mb-1">{player.nome}</h1>
          <div className="flex flex-wrap justify-center md:justify-start gap-4 mt-2">
            <span className="flex items-center bg-yellow-50 text-yellow-700 px-3 py-1 rounded-full text-sm font-bold border border-yellow-100">
              <Star className="w-4 h-4 mr-1 fill-current" />
              Nível {player.nivel_estrelas.toFixed(1)}
            </span>
            <span className="bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-sm font-bold border border-blue-100">
              {stats.total_jogos} Jogos
            </span>
          </div>
        </div>

        <div className="bg-green-50 p-6 rounded-2xl text-center min-w-[140px] border border-green-100">
          <div className="text-3xl font-black text-green-700">{winRate}%</div>
          <div className="text-xs font-bold text-green-600 uppercase tracking-widest mt-1">Vitórias</div>
        </div>
      </div>

      {/* Main Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Gols", value: stats.total_gols, icon: Target, color: "text-blue-600", bg: "bg-blue-50" },
          { label: "Assists", value: stats.total_assistencias, icon: Handshake, color: "text-purple-600", bg: "bg-purple-50" },
          { label: "Média", value: stats.media_gols.toFixed(2), icon: TrendingUp, color: "text-orange-600", bg: "bg-orange-50" },
          { label: "Títulos", value: 0, icon: Award, color: "text-yellow-600", bg: "bg-yellow-50" },
        ].map((item, id) => (
          <div key={id} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 text-center">
            <div className={cn("w-10 h-10 mx-auto rounded-xl flex items-center justify-center mb-3", item.bg, item.color)}>
              <item.icon className="w-6 h-6" />
            </div>
            <div className="text-2xl font-black text-gray-900">{item.value}</div>
            <div className="text-xs font-bold text-gray-500 uppercase tracking-wider">{item.label}</div>
          </div>
        ))}
      </div>

      {/* Wins/Losses */}
      <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100">
        <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
          <Zap className="w-5 h-5 mr-2 text-blue-600" />
          Retrospecto
        </h2>
        
        <div className="flex gap-1 h-4 w-full bg-gray-100 rounded-full overflow-hidden mb-6">
          <div style={{ width: `${(stats.total_vitorias / Math.max(1, stats.total_jogos)) * 100}%` }} className="bg-green-500"></div>
          <div style={{ width: `${(stats.total_empates / Math.max(1, stats.total_jogos)) * 100}%` }} className="bg-gray-400"></div>
          <div style={{ width: `${(stats.total_derrotas / Math.max(1, stats.total_jogos)) * 100}%` }} className="bg-red-500"></div>
        </div>

        <div className="grid grid-cols-3 gap-8">
          <div className="text-center">
            <div className="text-2xl font-black text-green-600">{stats.total_vitorias}</div>
            <div className="text-xs font-bold text-gray-500 uppercase">Vitórias</div>
          </div>
          <div className="text-center border-x border-gray-100">
            <div className="text-2xl font-black text-gray-600">{stats.total_empates}</div>
            <div className="text-xs font-bold text-gray-500 uppercase">Empates</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-black text-red-600">{stats.total_derrotas}</div>
            <div className="text-xs font-bold text-gray-500 uppercase">Derrotas</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PlayerProfile;
