import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
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
import { toast } from "react-hot-toast";
import { cn } from "../lib/utils";
import api from "../services/api";

interface Team {
  id: string;
  name: string;
}

interface Match {
  id: string;
  homeTeamId: string;
  awayTeamId: string;
  homeGoals: number;
  awayGoals: number;
  date: string;
}

const Matches = () => {
  const [matches, setMatches] = useState<Match[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);

  // Form state
  const [homeTeamId, setHomeTeamId] = useState("");
  const [awayTeamId, setAwayTeamId] = useState("");
  const [homeGoals, setHomeGoals] = useState(0);
  const [awayGoals, setAwayGoals] = useState(0);
  const [date, setDate] = useState("");

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [matchesRes, teamsRes] = await Promise.all([
        api.get("/partidas"),
        api.get("/times")
      ]);
      setMatches(matchesRes.data);
      setTeams(teamsRes.data);
    } catch (error) {
      toast.error("Erro ao carregar dados.");
    } finally {
      setIsFetching(false);
    }
  };

  const handleAddMatch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (homeTeamId === awayTeamId) {
      toast.error("Os times devem ser diferentes.");
      return;
    }
    setIsLoading(true);

    try {
      await api.post("/partidas", {
        homeTeamId,
        awayTeamId,
        homeGoals,
        awayGoals,
        date
      });
      
      toast.success("Partida registrada com sucesso!");
      fetchData();
      setIsModalOpen(false);
      resetForm();
    } catch (error) {
      toast.error("Erro ao registrar partida.");
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setHomeTeamId("");
    setAwayTeamId("");
    setHomeGoals(0);
    setAwayGoals(0);
    setDate("");
  };

  const getTeamName = (id: string) => {
    return teams.find(t => t.id === id)?.name || "N/A";
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gestão de Partidas</h1>
          <p className="text-gray-600">Registre e acompanhe os resultados dos jogos.</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-lg text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 transition-colors shadow-sm"
        >
          <PlusCircle className="mr-2 h-4 w-4" />
          Nova Partida
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {matches.map((match) => (
          <Link key={match.id} to={`/matches/${match.id}`} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden p-6 hover:shadow-md transition-all group">
            <div className="text-center mb-4">
              <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                {new Date(match.date).toLocaleDateString()}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex-1 text-center">
                <div className="h-12 w-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-2 group-hover:scale-110 transition-transform">
                  <Users className="h-6 w-6 text-blue-600" />
                </div>
                <h3 className="font-bold text-gray-900">{getTeamName(match.homeTeamId)}</h3>
              </div>
              <div className="flex items-center gap-4 px-4">
                <span className="text-4xl font-black text-gray-900">{match.homeGoals}</span>
                <span className="text-gray-300 font-bold">VS</span>
                <span className="text-4xl font-black text-gray-900">{match.awayGoals}</span>
              </div>
              <div className="flex-1 text-center">
                <div className="h-12 w-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-2 group-hover:scale-110 transition-transform">
                  <Users className="h-6 w-6 text-red-600" />
                </div>
                <h3 className="font-bold text-gray-900">{getTeamName(match.awayTeamId)}</h3>
              </div>
            </div>
          </Link>
        ))}

        {matches.length === 0 && (
          <div className="col-span-full py-12 text-center bg-white rounded-2xl border border-dashed border-gray-300">
            <Calendar className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">Nenhuma partida registrada ainda.</p>
          </div>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-xl overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">Registrar Partida</h2>
              <button onClick={() => setIsModalOpen(false)} className="p-2 text-gray-400 hover:bg-gray-100 rounded-lg">
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleAddMatch} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Time Casa</label>
                  <select required className="w-full px-3 py-2 border border-gray-300 rounded-lg" value={homeTeamId} onChange={(e) => setHomeTeamId(e.target.value)}>
                    <option value="">Selecione</option>
                    {teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Time Fora</label>
                  <select required className="w-full px-3 py-2 border border-gray-300 rounded-lg" value={awayTeamId} onChange={(e) => setAwayTeamId(e.target.value)}>
                    <option value="">Selecione</option>
                    {teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Gols Casa</label>
                  <input type="number" required min="0" className="w-full px-3 py-2 border border-gray-300 rounded-lg" value={homeGoals} onChange={(e) => setHomeGoals(parseInt(e.target.value))} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Gols Fora</label>
                  <input type="number" required min="0" className="w-full px-3 py-2 border border-gray-300 rounded-lg" value={awayGoals} onChange={(e) => setAwayGoals(parseInt(e.target.value))} />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Data</label>
                <input type="date" required className="w-full px-3 py-2 border border-gray-300 rounded-lg" value={date} onChange={(e) => setDate(e.target.value)} />
              </div>
              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700">Cancelar</button>
                <button type="submit" disabled={isLoading} className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50">
                  {isLoading ? <Loader2 className="animate-spin h-4 w-4 mx-auto" /> : "Registrar"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Matches;
