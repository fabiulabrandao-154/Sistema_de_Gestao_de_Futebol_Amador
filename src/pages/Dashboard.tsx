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
      const [playersRes, matchesRes] = await Promise.all([
        api.get("/players"),
        api.get("/matches"),
      ]);

      const players = playersRes.data;
      const matches = matchesRes.data;

      const avgLevel = players.length 
        ? (players.reduce((acc: number, p: any) => acc + p.level, 0) / players.length).toFixed(1)
        : "0.0";

      const nextMatch = matches
        .filter((m: any) => m.status === "agendada")
        .sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime())[0];

      setStats([
        { name: "Total de Jogadores", value: players.length.toString(), icon: Users, color: "bg-blue-500" },
        { name: "Peladas Realizadas", value: matches.filter((m: any) => m.status === "encerrada").length.toString(), icon: Trophy, color: "bg-green-500" },
        { name: "Próxima Pelada", value: nextMatch ? `${new Date(nextMatch.date).toLocaleDateString()} ${nextMatch.time}` : "Nenhuma", icon: Calendar, color: "bg-purple-500" },
        { name: "Média de Nível", value: avgLevel, icon: TrendingUp, color: "bg-orange-500" },
      ]);

      setRecentMatches(matches.slice(0, 5));
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
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Bem-vindo, {user?.name}!</h1>
          <p className="text-gray-600">Aqui está o resumo da sua gestão.</p>
        </div>
        <div className="flex gap-3">
          <Link
            to="/players"
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors"
          >
            <Users className="mr-2 h-4 w-4" />
            Jogadores
          </Link>
          <Link
            to="/matches"
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-lg text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 transition-colors shadow-sm"
          >
            <PlusCircle className="mr-2 h-4 w-4" />
            Nova Pelada
          </Link>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <div key={stat.name} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center">
            <div className={`${stat.color} p-3 rounded-xl text-white mr-4`}>
              <stat.icon className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">{stat.name}</p>
              <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Matches */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-6 border-b border-gray-100 flex items-center justify-between">
            <h2 className="text-lg font-bold text-gray-900">Peladas Recentes</h2>
            <Link to="/matches" className="text-sm font-medium text-blue-600 hover:text-blue-500">
              Ver todas
            </Link>
          </div>
          <div className="divide-y divide-gray-100">
            {recentMatches.map((match) => (
              <Link
                key={match.id}
                to={`/matches/${match.id}`}
                className="flex items-center p-6 hover:bg-gray-50 transition-colors group"
              >
                <div className="flex-1">
                  <h3 className="text-sm font-bold text-gray-900 group-hover:text-blue-600 transition-colors">
                    {match.title}
                  </h3>
                  <p className="text-xs text-gray-500 mt-1">
                    {match.date} • {match.players} jogadores
                  </p>
                </div>
                <div className="flex items-center">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 mr-4">
                    {match.status}
                  </span>
                  <ChevronRight className="h-5 w-5 text-gray-400 group-hover:text-blue-600 transition-colors" />
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Quick Actions / Tips */}
        <div className="bg-blue-600 rounded-2xl p-8 text-white flex flex-col justify-between relative overflow-hidden">
          <div className="relative z-10">
            <h2 className="text-2xl font-bold mb-4">Dica de Gestão</h2>
            <p className="text-blue-100 leading-relaxed mb-6">
              Mantenha o nível dos jogadores atualizado para garantir sorteios equilibrados. 
              Você pode editar o nível de estrelas na aba de Jogadores.
            </p>
            <Link
              to="/players"
              className="inline-flex items-center px-6 py-3 bg-white text-blue-600 rounded-xl font-bold hover:bg-blue-50 transition-colors"
            >
              Atualizar Níveis
            </Link>
          </div>
          {/* Decorative circles */}
          <div className="absolute -right-8 -bottom-8 w-48 h-48 bg-blue-500 rounded-full opacity-50"></div>
          <div className="absolute -right-16 -bottom-16 w-48 h-48 bg-blue-400 rounded-full opacity-30"></div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
