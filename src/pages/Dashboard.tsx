import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { 
  Users, 
  Trophy, 
  Calendar, 
  TrendingUp,
  PlusCircle,
  ChevronRight,
  Loader2
} from "lucide-react";
import api from "../services/api";
import { cn } from "../lib/utils";

const Dashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<any[]>([]);
  const [recentMatches, setRecentMatches] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [playersRes, peladasRes] = await Promise.all([
        api.get("/jogadores/"),
        api.get("/peladas/"),
      ]);

      const players = playersRes.data;
      const peladas = peladasRes.data;

      setStats([
        { name: "Meus Jogadores", value: players.length.toString(), icon: Users, color: "bg-green-500" },
        { name: "Jogadores Ativos", value: players.filter((p: any) => p.ativo).length.toString(), icon: Users, color: "bg-blue-500" },
        { name: "Total de Peladas", value: peladas.length.toString(), icon: Calendar, color: "bg-purple-500" },
        { name: "Nível Médio", value: (players.reduce((acc: number, p: any) => acc + p.nivel_estrelas, 0) / (players.length || 1)).toFixed(1), icon: Trophy, color: "bg-orange-500" },
      ]);

      setRecentMatches(peladas.slice(-5).reverse());
    } catch (error) {
      console.error("Erro ao carregar dashboard");
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="animate-spin h-12 w-12 text-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-8 font-sans">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-200 pb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Dashboard</h1>
          <p className="text-gray-500 italic font-serif text-sm">Bem-vindo ao centro de comando, {user?.name}.</p>
        </div>
        <div className="flex gap-3">
          <Link
            to="/players"
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-all shadow-sm"
          >
            <Users className="mr-2 h-4 w-4" />
            Jogadores
          </Link>
          <Link
            to="/peladas"
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md text-sm font-medium text-white bg-green-600 hover:bg-green-700 transition-all shadow-sm"
          >
            <PlusCircle className="mr-2 h-4 w-4" />
            Minhas Peladas
          </Link>
        </div>
      </div>

      {/* Stats Grid - Technical Style */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-0 border border-gray-200 rounded-lg overflow-hidden shadow-sm">
        {stats.map((stat) => (
          <div key={stat.name} className="bg-white p-6 border-r border-b sm:border-b-0 last:border-r-0 border-gray-200 hover:bg-gray-50 transition-colors group">
            <div className="flex items-center justify-between mb-4">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest font-mono">{stat.name}</p>
              <stat.icon className="h-4 w-4 text-gray-300 group-hover:text-blue-500 transition-colors" />
            </div>
            <p className="text-3xl font-bold text-gray-900 font-mono tracking-tighter">{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Matches Table - Data Grid Style */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-gray-900 uppercase tracking-tight">Próximas Peladas</h2>
            <Link to="/peladas" className="text-sm text-green-600 hover:underline flex items-center">
              Ver todas <ChevronRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm">
            <div className="grid grid-cols-4 bg-gray-50 border-b border-gray-200 p-3">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest font-mono">Pelada</span>
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest font-mono">Data</span>
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest font-mono">Local</span>
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest font-mono">Status</span>
            </div>
            {recentMatches.length > 0 ? (
              recentMatches.map((match) => (
                <Link
                  key={match.id}
                  to={`/peladas/${match.id}`}
                  className="grid grid-cols-4 p-4 border-b last:border-b-0 border-gray-100 hover:bg-green-50 transition-colors group"
                >
                  <span className="text-sm font-medium text-gray-900 truncate">{match.titulo}</span>
                  <span className="text-sm text-gray-500 font-mono">{new Date(match.data_hora).toLocaleDateString()}</span>
                  <span className="text-sm text-gray-900 font-semibold truncate">
                    {match.local}
                  </span>
                  <span className={cn(
                    "text-[10px] font-bold uppercase tracking-widest self-center px-2 py-1 rounded-full w-fit",
                    match.status === 'agendada' ? "bg-blue-100 text-blue-700" : "bg-green-100 text-green-700"
                  )}>
                    {match.status}
                  </span>
                </Link>
              ))
            ) : (
              <div className="p-8 text-center text-gray-500 italic font-serif">
                Nenhuma pelada encontrada.
              </div>
            )}
          </div>
        </div>

        {/* Quick Actions / Info */}
        <div className="space-y-4">
          <h2 className="text-lg font-bold text-gray-900 uppercase tracking-tight">Dica de Gestão</h2>
          <div className="bg-blue-600 rounded-lg p-8 text-white relative overflow-hidden shadow-lg">
            <div className="relative z-10">
              <h3 className="text-xl font-bold mb-4">Equilíbrio é Tudo</h3>
              <p className="text-blue-100 leading-relaxed mb-6 text-sm">
                Mantenha o nível dos jogadores atualizado para garantir sorteios equilibrados. 
                Você pode editar o nível de estrelas na aba de Jogadores.
              </p>
              <Link
                to="/players"
                className="inline-flex items-center px-4 py-2 bg-white text-blue-600 rounded-md font-bold text-sm hover:bg-blue-50 transition-colors shadow-sm"
              >
                Atualizar Níveis
              </Link>
            </div>
            <div className="absolute -right-8 -bottom-8 w-32 h-32 bg-blue-500 rounded-full opacity-50"></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
