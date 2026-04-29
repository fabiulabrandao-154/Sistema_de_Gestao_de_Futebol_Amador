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

const MatchDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [match, setMatch] = useState<Match | null>(null);
  const [teams, setTeams] = useState<Team[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, [id]);

  const fetchData = async () => {
    try {
      const [matchRes, teamsRes] = await Promise.all([
        api.get(`/partidas/${id}`),
        api.get("/times")
      ]);
      setMatch(matchRes.data);
      setTeams(teamsRes.data);
    } catch (error) {
      toast.error("Erro ao carregar dados da partida.");
      navigate("/matches");
    } finally {
      setIsLoading(false);
    }
  };

  const getTeamName = (teamId: string) => {
    return teams.find(t => t.id === teamId)?.name || "N/A";
  };

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
        <h1 className="text-2xl font-bold text-gray-900">Detalhes da Partida</h1>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
        <div className="text-center mb-8">
          <div className="inline-flex items-center px-3 py-1 bg-gray-100 rounded-full text-sm font-medium text-gray-600 mb-2">
            <Calendar className="h-4 w-4 mr-2" />
            {new Date(match.date).toLocaleDateString()}
          </div>
        </div>

        <div className="flex items-center justify-around max-w-4xl mx-auto">
          <div className="text-center flex-1">
            <div className="h-24 w-24 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4 shadow-inner">
              <Users className="h-12 w-12 text-blue-600" />
            </div>
            <h2 className="text-2xl font-black text-gray-900 uppercase tracking-tight">
              {getTeamName(match.homeTeamId)}
            </h2>
            <p className="text-sm text-gray-500 font-medium mt-1">MANDANTE</p>
          </div>

          <div className="flex flex-col items-center px-8">
            <div className="flex items-center gap-6 mb-2">
              <span className="text-7xl font-black text-gray-900 tabular-nums">{match.homeGoals}</span>
              <span className="text-3xl font-bold text-gray-300">X</span>
              <span className="text-7xl font-black text-gray-900 tabular-nums">{match.awayGoals}</span>
            </div>
            <div className="px-4 py-1 bg-green-100 text-green-700 rounded-full text-xs font-bold uppercase tracking-widest">
              Finalizada
            </div>
          </div>

          <div className="text-center flex-1">
            <div className="h-24 w-24 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4 shadow-inner">
              <Users className="h-12 w-12 text-red-600" />
            </div>
            <h2 className="text-2xl font-black text-gray-900 uppercase tracking-tight">
              {getTeamName(match.awayTeamId)}
            </h2>
            <p className="text-sm text-gray-500 font-medium mt-1">VISITANTE</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MatchDetail;
