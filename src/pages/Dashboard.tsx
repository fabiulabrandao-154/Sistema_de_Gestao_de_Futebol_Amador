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
import { toast } from "react-hot-toast";
import DataService from "../services/dataService";
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

  const fetchDashboardData = () => {
    try {
      const players = DataService.getPlayers();
      const peladas = DataService.getPeladas();

      setStats([
        { name: "Meus Jogadores", value: players.length.toString(), icon: Users, color: "bg-green-500" },
        { name: "Jogadores Ativos", value: players.filter((p: any) => p.ativo).length.toString(), icon: Users, color: "bg-blue-500" },
        { name: "Total de Peladas", value: peladas.length.toString(), icon: Calendar, color: "bg-purple-500" },
        { name: "Nível Médio", value: (players.reduce((acc: number, p: any) => acc + (p.nivel_estrelas || 0), 0) / (players.length || 1)).toFixed(1), icon: Trophy, color: "bg-orange-500" },
      ]);

      const upcoming = peladas.filter(p => p.status !== 'encerrada' && p.status !== 'finalizada');
      setRecentMatches(upcoming.slice(0, 5));

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
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-app-border pb-6">
        <div>
          <h1 className="text-3xl font-bold text-app-text tracking-tight">Dashboard</h1>
          <p className="text-app-text-muted italic font-serif text-sm">Bem-vindo ao centro de comando, {user?.name}.</p>
        </div>
        <div className="flex gap-3">
          <Link
            to="/players"
            className="inline-flex items-center px-4 py-2 border border-app-border rounded-md text-sm font-medium text-app-text bg-app-card hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all shadow-sm"
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
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-0 border border-app-border rounded-lg overflow-hidden shadow-sm">
        {stats.map((stat) => (
          <div key={stat.name} className="bg-app-card p-6 border-r border-b sm:border-b-0 last:border-r-0 border-app-border hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors group">
            <div className="flex items-center justify-between mb-4">
              <p className="text-[10px] font-bold text-app-text-muted uppercase tracking-widest font-mono">{stat.name}</p>
              <stat.icon className="h-4 w-4 text-app-text-muted group-hover:text-blue-500 transition-colors" />
            </div>
            <p className="text-3xl font-bold text-app-text font-mono tracking-tighter">{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Matches Table - Data Grid Style */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-app-text uppercase tracking-tight">Próximas Peladas</h2>
            <Link to="/peladas" className="text-sm text-green-500 hover:underline flex items-center">
              Ver todas <ChevronRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="bg-app-card border border-app-border rounded-lg overflow-hidden shadow-sm">
            <div className="grid grid-cols-4 bg-zinc-100 dark:bg-zinc-800/50 border-b border-app-border p-3">
              <span className="text-[10px] font-bold text-app-text-muted uppercase tracking-widest font-mono">Pelada</span>
              <span className="text-[10px] font-bold text-app-text-muted uppercase tracking-widest font-mono">Data</span>
              <span className="text-[10px] font-bold text-app-text-muted uppercase tracking-widest font-mono">Local</span>
              <span className="text-[10px] font-bold text-app-text-muted uppercase tracking-widest font-mono">Status</span>
            </div>
            {recentMatches.length > 0 ? (
              recentMatches.map((match) => (
                <Link
                  key={match.id}
                  to={`/peladas/${match.id}`}
                  className="grid grid-cols-4 p-4 border-b last:border-b-0 border-app-border hover:bg-zinc-100 dark:hover:bg-zinc-800/50 transition-colors group"
                >
                  <span className="text-sm font-medium text-app-text truncate">{match.titulo}</span>
                  <span className="text-sm text-app-text-muted font-mono">{new Date(match.data_hora).toLocaleDateString()}</span>
                  <span className="text-sm text-app-text font-semibold truncate">
                    {match.local}
                  </span>
                  <span className={cn(
                    "text-[10px] font-bold uppercase tracking-widest self-center px-2 py-1 rounded-full w-fit",
                    match.status === 'agendada' ? "bg-blue-600/20 text-blue-500" : "bg-green-600/20 text-green-500"
                  )}>
                    {match.status}
                  </span>
                </Link>
              ))
            ) : (
              <div className="p-8 text-center text-app-text-muted italic font-serif">
                Nenhuma pelada encontrada.
              </div>
            )}
          </div>
        </div>

        {/* Quick Actions / Info */}
        <div className="space-y-4">
          <h2 className="text-lg font-bold text-app-text uppercase tracking-tight">Dica de Gestão</h2>
          <div className="bg-blue-600 rounded-lg p-8 text-white relative overflow-hidden shadow-lg border border-blue-500/20">
            <div className="relative z-10">
              <h3 className="text-xl font-bold mb-4">Equilíbrio é Tudo</h3>
              <p className="text-blue-100 leading-relaxed mb-6 text-sm">
                Mantenha o nível dos jogadores atualizado para garantir sorteios equilibrados. 
                Você pode editar o nível de estrelas na aba de Jogadores.
              </p>
              <Link
                to="/players"
                className="inline-flex items-center px-4 py-2 bg-app-bg text-app-text border border-blue-400/30 rounded-md font-bold text-sm hover:opacity-90 transition-colors shadow-sm"
              >
                Atualizar Níveis
              </Link>
            </div>
            <div className="absolute -right-8 -bottom-8 w-32 h-32 bg-blue-500/50 rounded-full blur-2xl"></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
