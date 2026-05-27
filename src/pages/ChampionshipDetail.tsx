import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ChevronLeft,
  Trophy,
  Users,
  Calendar,
  Settings,
  Plus,
  Loader2,
  Table as TableIcon,
  Play,
  ClipboardCheck,
  Award,
  X,
} from "lucide-react";
import api from "../services/api";
import { toast } from "react-hot-toast";
import DataService from "../services/dataService";
import { getLocalData, saveLocalData, setLocalData } from "../lib/localData";
import { cn } from "../lib/utils";

interface Team {
  id: string;
  nome: string;
  players?: string[];
  teamPlayers?: { id: string; playerId: string; playerName: string }[];
}

interface Game {
  id: string;
  time_casa: string;
  time_visitante: string;
  time_casa_nome: string;
  time_visitante_nome: string;
  gols_casa: number;
  gols_visitante: number;
  data_hora: string;
  status: string;
  round: number;
  eventos?: any[];
  events?: any[];
}

interface Championship {
  id: string;
  nome: string;
  descricao?: string;
  formato: string;
  jogos_ida_volta?: boolean;
  data_inicio: string;
  times: Team[];
  jogos: Game[];
}

const ChampionshipDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [champ, setChamp] = useState<Championship | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<
    "tabela" | "jogos" | "times" | "artilharia" | "cartoes"
  >("tabela");
  const [standings, setStandings] = useState<any[]>([]);
  const [scorers, setScorers] = useState<any[]>([]);
  const [cards, setCards] = useState<any[]>([]);
  const [showResultModal, setShowResultModal] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [editingGameId, setEditingGameId] = useState<string | null>(null);

  const recalculateLocalStats = (latestChamp: Championship) => {
    // 1. Calculate STANDINGS (Classificação)
    const teamStatsMap: Record<string, any> = {};
    latestChamp.times.forEach((t) => {
      teamStatsMap[t.id] = {
        id: t.id,
        nome: t.nome,
        pts: 0,
        pj: 0,
        v: 0,
        e: 0,
        d: 0,
        gp: 0,
        gc: 0,
        sg: 0,
      };
    });

    latestChamp.jogos.forEach((g) => {
      if (g.status === "realizado") {
        const hc = g.gols_casa ?? 0;
        const ac = g.gols_visitante ?? 0;
        const homeId = g.time_casa;
        const awayId = g.time_visitante;

        if (teamStatsMap[homeId] && teamStatsMap[awayId]) {
          teamStatsMap[homeId].pj += 1;
          teamStatsMap[awayId].pj += 1;
          teamStatsMap[homeId].gp += hc;
          teamStatsMap[homeId].gc += ac;
          teamStatsMap[awayId].gp += ac;
          teamStatsMap[awayId].gc += hc;

          if (hc > ac) {
            teamStatsMap[homeId].v += 1;
            teamStatsMap[homeId].pts += 3;
            teamStatsMap[awayId].d += 1;
          } else if (hc < ac) {
            teamStatsMap[awayId].v += 1;
            teamStatsMap[awayId].pts += 3;
            teamStatsMap[homeId].d += 1;
          } else {
            teamStatsMap[homeId].e += 1;
            teamStatsMap[homeId].pts += 1;
            teamStatsMap[awayId].e += 1;
            teamStatsMap[awayId].pts += 1;
          }
        }
      }
    });

    const standingsList = Object.values(teamStatsMap).map((t: any) => {
      t.sg = t.gp - t.gc;
      return t;
    });

    standingsList.sort((a: any, b: any) => {
      if (b.pts !== a.pts) return b.pts - a.pts;
      if (b.v !== a.v) return b.v - a.v;
      if (b.sg !== a.sg) return b.sg - a.sg;
      return b.gp - a.gp;
    });

    setStandings(standingsList);

    // 2. Calculate SCORERS (Artilharia)
    const playerGoalsMap: Record<string, { id?: string; jogadorNome: string; teamName: string; gols: number }> = {};
    latestChamp.jogos.forEach((g) => {
      const evs = g.eventos || g.events || [];
      evs.forEach((e: any) => {
        if (e.tipo === "gol" || e.type === "gol") {
          const pName = e.jogadorNome || e.jogadorName || e.playerName;
          if (pName) {
            let tName = "";
            const foundTeam = latestChamp.times.find((t) => t.id === e.timeId || t.id === e.teamId);
            if (foundTeam) {
              tName = foundTeam.nome;
            }
            if (!playerGoalsMap[pName]) {
              playerGoalsMap[pName] = {
                jogadorNome: pName,
                teamName: tName,
                gols: 0
              };
            }
            playerGoalsMap[pName].gols += 1;
          }
        }
      });
    });

    const scorersList = Object.values(playerGoalsMap).sort((a, b) => b.gols - a.gols);
    setScorers(scorersList);

    // 3. Calculate CARDS (Cartões)
    const playerCardsMap: Record<string, { nome: string; amarelos: number; vermelhos: number; suspenso: boolean }> = {};
    latestChamp.jogos.forEach((g) => {
      const evs = g.eventos || g.events || [];
      evs.forEach((e: any) => {
        const type = e.tipo || e.type;
        const pName = e.jogadorNome || e.jogadorName || e.playerName;
        if (pName && (type === "cartao_amarelo" || type === "cartao_vermelho")) {
          if (!playerCardsMap[pName]) {
            playerCardsMap[pName] = {
              nome: pName,
              amarelos: 0,
              vermelhos: 0,
              suspenso: false
            };
          }
          if (type === "cartao_amarelo") {
            playerCardsMap[pName].amarelos += 1;
          } else if (type === "cartao_vermelho") {
            playerCardsMap[pName].vermelhos += 1;
          }
        }
      });
    });

    const cardsList = Object.values(playerCardsMap).map((p) => {
      if (p.amarelos >= 3 || p.vermelhos >= 1) {
        p.suspenso = true;
      }
      return p;
    });

    cardsList.sort((a, b) => {
      if (b.vermelhos !== a.vermelhos) return b.vermelhos - a.vermelhos;
      return b.amarelos - a.amarelos;
    });

    setCards(cardsList);
  };

  useEffect(() => {
    fetchChamp();
    if (activeTab === "tabela") fetchStandings();
    else if (activeTab === "artilharia") fetchScorers();
    else if (activeTab === "cartoes") fetchCards();
  }, [id, activeTab]);

  const fetchCards = async () => {
    try {
      const resp = await api.get(`/championships/${id}/cartoes`);
      setCards(Array.isArray(resp.data) ? resp.data : []);
    } catch (e) {
      if (champ) {
        recalculateLocalStats(champ);
      } else {
        setCards([]);
      }
    }
  };
  const [selectedGame, setSelectedGame] = useState<Game | null>(null);

  const [homeGoals, setHomeGoals] = useState(0);
  const [awayGoals, setAwayGoals] = useState(0);
  const [gameEvents, setGameEvents] = useState<any[]>([]);

  const [showAddTeamModal, setShowAddTeamModal] = useState(false);
  const [newTeamName, setNewTeamName] = useState("");

  const [showAddPlayerModal, setShowAddPlayerModal] = useState(false);
  const [selectedTeamIdForPlayer, setSelectedTeamIdForPlayer] = useState("");
  const [newPlayerName, setNewPlayerName] = useState("");

  // Event inputs for Súmula Modal
  const [eventTeam, setEventTeam] = useState<"casa" | "fora">("casa");
  const [eventType, setEventType] = useState<
    "gol" | "cartao_amarelo" | "cartao_vermelho"
  >("gol");
  const [eventPlayer, setEventPlayer] = useState<string>("");
  const [customPlayerName, setCustomPlayerName] = useState<string>("");

  const fetchStandings = async () => {
    try {
      const resp = await api.get(`/championships/${id}/classificacao`);
      setStandings(Array.isArray(resp.data) ? resp.data : []);
    } catch (e) {
      if (champ) {
        recalculateLocalStats(champ);
      } else {
        setStandings([]);
      }
    }
  };

  const fetchScorers = async () => {
    try {
      const resp = await api.get(`/championships/${id}/artilharia`);
      setScorers(Array.isArray(resp.data) ? resp.data : []);
    } catch (e) {
      if (champ) {
        recalculateLocalStats(champ);
      } else {
        setScorers([]);
      }
    }
  };

  const fetchChamp = async () => {
    try {
      const response = await api.get(`/championships/${id}`);
      const data = response.data;
      if (data) {
        if (!data.times) data.times = [];
        if (!data.jogos) data.jogos = [];
      }
      setChamp(data);
    } catch (error) {
      console.warn("Fetch failed, searching local championship");
      const locals = getLocalData("championships");
      const found = locals.find((c: any) => c.id === id);
      if (found) {
        if (!found.times) found.times = [];
        if (!found.jogos) found.jogos = [];
        setChamp(found);
        recalculateLocalStats(found);
      } else {
        toast.error("Erro ao carregar campeonato.");
      }
    } finally {
      setLoading(false);
    }
  };

  const updateLocalChamp = (updatedChamp: Championship) => {
    const locals = getLocalData("championships") || [];
    const index = locals.findIndex((c: any) => c.id === id);
    if (index > -1) {
      locals[index] = { ...locals[index], ...updatedChamp };
    } else {
      locals.push(updatedChamp);
    }
    setLocalData("championships", locals);
  };

  const getTablePreview = () => {
    if (!champ || champ.times.length < 2) return [];
    const teamList = [...champ.times];
    const numTeams = teamList.length;
    const isOdd = numTeams % 2 !== 0;

    const list = teamList.map((t) => ({ id: t.id, nome: t.nome }));
    if (isOdd) list.push({ id: "BYE", nome: "Folga" });

    const tournamentNumTeams = list.length;
    const rounds = tournamentNumTeams - 1;
    const half = tournamentNumTeams / 2;
    const matches: { round: number; home: string; away: string }[] = [];

    for (let round = 1; round <= rounds; round++) {
      for (let i = 0; i < half; i++) {
        const home = list[i];
        const away = list[tournamentNumTeams - 1 - i];
        if (home.id !== "BYE" && away.id !== "BYE") {
          matches.push({
            round,
            home: home.nome,
            away: away.nome,
          });
        }
      }
      list.splice(1, 0, list.pop()!);
    }
    return matches;
  };

  const handleGenerateTable = async () => {
    try {
      await api.post(`/championships/${id}/gerar_tabela`);
      toast.success("Tabela gerada com sucesso!");
      setShowPreviewModal(false);
      fetchChamp();
    } catch (error) {
      if (champ) {
        const preview = getTablePreview();
        const generatedGames = preview.map((m, idx) => ({
          id: `local_g_${idx}_${Math.random().toString(36).substr(2, 5)}`,
          time_casa: champ.times.find((t) => t.nome === m.home)?.id || "1",
          time_visitante: champ.times.find((t) => t.nome === m.away)?.id || "2",
          time_casa_nome: m.home,
          time_visitante_nome: m.away,
          gols_casa: 0,
          gols_visitante: 0,
          data_hora: new Date(
            Date.now() + idx * 2 * 60 * 60 * 1000,
          ).toISOString(),
          round: m.round,
          status: "agendado",
        }));
        const nChamp = { ...champ, jogos: generatedGames };
        setChamp(nChamp);
        updateLocalChamp(nChamp);
        toast.success("Tabela gerada localmente (servidor offline)!");
        setShowPreviewModal(false);
      } else {
        toast.error("Erro ao gerar tabela.");
      }
    }
  };

  const handleAddNewTeam = async () => {
    if (!newTeamName.trim()) return;
    try {
      await api.post(`/championships/${id}/times`, { nome: newTeamName });
      toast.success("Time adicionado com sucesso!");
      setNewTeamName("");
      setShowAddTeamModal(false);
      fetchChamp();
    } catch (error) {
      if (champ) {
        const newTeam = {
          id: `local_t_${Math.random().toString(36).substr(2, 5)}`,
          nome: newTeamName,
          players: [],
        };
        const nChamp = { ...champ, times: [...champ.times, newTeam] };
        setChamp(nChamp);
        updateLocalChamp(nChamp);
        setNewTeamName("");
        setShowAddTeamModal(false);
        toast.success("Time adicionado localmente!");
      } else {
        toast.error("Erro ao adicionar time.");
      }
    }
  };

  const handleAddNewPlayer = async () => {
    if (!newPlayerName.trim()) return;
    try {
      await api.post(
        `/championships/${id}/times/${selectedTeamIdForPlayer}/jogadores`,
        { playerName: newPlayerName },
      );
      toast.success("Jogador cadastrado!");
      setNewPlayerName("");
      setShowAddPlayerModal(false);
      fetchChamp();
    } catch (e) {
      if (champ) {
        const updatedTimes = champ.times.map((t: Team) => {
          if (t.id === selectedTeamIdForPlayer) {
            const list = t.players || [];
            return {
              ...t,
              players: [
                ...list.filter((x: string) => x !== newPlayerName),
                newPlayerName,
              ],
            };
          }
          return t;
        });

        const nChamp = { ...champ, times: updatedTimes };
        setChamp(nChamp);
        updateLocalChamp(nChamp);
        setNewPlayerName("");
        setShowAddPlayerModal(false);
        toast.success("Jogador cadastrado localmente!");
      }
    }
  };

  const handleRemovePlayerFromTeam = async (
    teamId: string,
    playerName: string,
  ) => {
    if (!window.confirm(`Deseja remover ${playerName} deste time?`)) return;
    try {
      await api.delete(`/championships/${id}/times/${teamId}/jogadores`, {
        data: { playerName },
      });
      toast.success("Jogador removido!");
      fetchChamp();
    } catch (e) {
      if (champ) {
        const updatedTimes = champ.times.map((t: Team) => {
          if (t.id === teamId) {
            const list = t.players || [];
            return {
              ...t,
              players: list.filter((x: string) => x !== playerName),
            };
          }
          return t;
        });
        const nChamp = { ...champ, times: updatedTimes };
        setChamp(nChamp);
        updateLocalChamp(nChamp);
        toast.success("Jogador removido localmente!");
      }
    }
  };

  const handleSaveGameTime = async (gameId: string, dateTimeString: string) => {
    if (!dateTimeString) return;
    try {
      await api.put(`/championships/${id}/jogos/${gameId}/horario`, {
        data_hora: dateTimeString,
      });
      toast.success("Horário da partida atualizado!");
      fetchChamp();
    } catch (e) {
      if (champ) {
        const updatedJogos = champ.jogos.map((g: Game) => {
          if (g.id === gameId) {
            return { ...g, data_hora: new Date(dateTimeString).toISOString() };
          }
          return g;
        });
        const nChamp = { ...champ, jogos: updatedJogos };
        setChamp(nChamp);
        updateLocalChamp(nChamp);
        toast.success("Horário atualizado localmente!");
      }
    }
  };

  if (loading)
    return (
      <div className="flex flex-col items-center justify-center p-12 bg-app-bg min-h-screen space-y-4">
        <Loader2 className="animate-spin text-blue-500 w-8 h-8" />
        <span className="text-app-text-muted">Carregando campeonato...</span>
      </div>
    );

  if (!champ)
    return (
      <div className="p-12 text-center bg-app-bg min-h-screen space-y-4">
        <div className="text-app-text-muted text-xl italic font-bold">
          Campeonato não encontrado.
        </div>
        <button
          onClick={() => navigate("/championships")}
          className="bg-blue-600 text-white px-6 py-2 rounded-xl font-bold hover:bg-blue-700 transition"
        >
          Voltar para Campeonatos
        </button>
      </div>
    );

  return (
    <div className="space-y-6 pb-20">
      <button
        onClick={() => navigate("/championships")}
        className="flex items-center text-app-text-muted hover:text-green-500 transition font-bold"
      >
        <ChevronLeft className="w-4 h-4 mr-1" /> Voltar para Campeonatos
      </button>

      <div className="bg-app-card rounded-3xl border border-app-border p-8 relative overflow-hidden shadow-2xl">
        <div className="absolute top-0 right-0 p-8 opacity-5">
          <Trophy className="w-40 h-40 text-app-text" />
        </div>
        <div className="relative z-10">
          <h1 className="text-3xl font-black text-app-text uppercase tracking-tighter">
            {champ.nome}
          </h1>
          <div className="flex flex-wrap gap-4 mt-3">
            <span className="text-[10px] text-app-text-muted font-black uppercase tracking-widest flex items-center bg-zinc-100 dark:bg-zinc-800/50 border border-app-border px-3 py-1.5 rounded-full shadow-inner">
              <Calendar className="w-3.5 h-3.5 mr-1.5 text-zinc-500" />
              Início:{" "}
              {champ.data_inicio
                ? new Date(champ.data_inicio).toLocaleDateString()
                : "Não informada"}
            </span>
            <span className="text-[10px] text-app-text-muted font-black uppercase tracking-widest flex items-center bg-zinc-100 dark:bg-zinc-800/50 border border-app-border px-3 py-1.5 rounded-full shadow-inner">
              <Settings className="w-3.5 h-3.5 mr-1.5 text-zinc-500" />
              {champ.formato?.replace("_", " ") || "Simples"}
            </span>
          </div>

          <div className="mt-8 flex gap-2 overflow-x-auto pb-4 scrollbar-hide">
            {[
              { id: "tabela", icon: TableIcon, label: "Classificação" },
              { id: "jogos", icon: Play, label: "Tabela de Jogos" },
              { id: "artilharia", icon: Award, label: "Artilharia" },
              { id: "cartoes", icon: ClipboardCheck, label: "Cartões" },
              { id: "times", icon: Users, label: "Times" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center px-6 py-2.5 rounded-2xl text-xs font-black uppercase tracking-widest transition-all whitespace-nowrap ${
                  activeTab === tab.id
                    ? "bg-blue-600 text-white shadow-lg shadow-blue-900/30"
                    : "bg-zinc-100 dark:bg-zinc-800 text-app-text-muted border border-app-border hover:bg-zinc-200 dark:hover:bg-zinc-700 hover:text-app-text"
                }`}
              >
                <tab.icon className="w-3.5 h-3.5 mr-2" />
                {tab.label}
              </button>
            ))}
          </div>
        </div>
        <div className="bg-app-card rounded-3xl border border-app-border p-8 shadow-sm">
          {activeTab === "tabela" && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
                <div>
                  <h2 className="text-xl font-black text-app-text uppercase tracking-tight">
                    Classificação Atual
                  </h2>
                  <p className="text-xs text-app-text-muted">
                    Acompanhe a pontuação e saldo em tempo real.
                  </p>
                </div>
                {champ.jogos?.length === 0 && (
                  <button
                    onClick={() => setShowPreviewModal(true)}
                    className="bg-green-600 text-white px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest flex items-center shadow-lg shadow-green-900/20 hover:bg-green-700 transition active:scale-95"
                  >
                    <Play className="w-3.5 h-3.5 mr-2 fill-current" />
                    Gerar Tabela de Jogos
                  </button>
                )}
              </div>
              <div className="overflow-x-auto rounded-2xl border border-app-border bg-app-bg/20">
                <table className="w-full text-sm">
                  <thead className="bg-zinc-100 dark:bg-zinc-800/50 font-black text-app-text-muted uppercase text-[10px] tracking-widest">
                    <tr>
                      <th className="px-4 py-5 text-left">POS</th>
                      <th className="px-4 py-5 text-left">TIME</th>
                      <th className="px-4 py-5 text-center">PTS</th>
                      <th className="px-4 py-5 text-center">PJ</th>
                      <th className="px-4 py-5 text-center">V</th>
                      <th className="px-4 py-5 text-center">E</th>
                      <th className="px-4 py-5 text-center">D</th>
                      <th className="px-4 py-5 text-center">GP</th>
                      <th className="px-4 py-5 text-center">GC</th>
                      <th className="px-4 py-5 text-center">SG</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-app-border">
                    {(standings &&
                    Array.isArray(standings) &&
                    standings.length > 0
                      ? standings
                      : champ.times || []
                    ).map((team, idx) => (
                      <tr
                        key={team.id || idx}
                        className="hover:bg-app-bg/30 transition-colors group"
                      >
                        <td className="px-4 py-5 font-black text-app-text-muted">
                          {idx + 1}º
                        </td>
                        <td className="px-4 py-5 font-black text-app-text group-hover:text-blue-500 transition-colors uppercase tracking-tight">
                          {team.nome || "Time"}
                        </td>
                        <td className="px-4 py-5 text-center font-black text-blue-500 text-lg">
                          {team.pts || 0}
                        </td>
                        <td className="px-4 py-5 text-center font-bold text-app-text-muted">
                          {team.pj || 0}
                        </td>
                        <td className="px-4 py-5 text-center font-bold text-green-500">
                          {team.v || 0}
                        </td>
                        <td className="px-4 py-5 text-center font-bold text-app-text-muted">
                          {team.e || 0}
                        </td>
                        <td className="px-4 py-5 text-center font-bold text-red-500">
                          {team.d || 0}
                        </td>
                        <td className="px-4 py-5 text-center font-bold text-app-text-muted">
                          {team.gp || 0}
                        </td>
                        <td className="px-4 py-5 text-center font-bold text-app-text-muted">
                          {team.gc || 0}
                        </td>
                        <td
                          className={`px-4 py-5 text-center font-black ${Number(team.sg || 0) > 0 ? "text-green-500" : Number(team.sg || 0) < 0 ? "text-red-500" : "text-app-text-muted"}`}
                        >
                          {team.sg || 0}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === "jogos" && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-xl font-black text-app-text uppercase tracking-tight">
                    Calendário e Resultados
                  </h2>
                  <p className="text-app-text-muted text-xs">
                    Visualize e edite horários das partidas ou registre gols e
                    cartões.
                  </p>
                </div>
              </div>
              {champ.jogos?.length === 0 ? (
                <div className="text-center py-20 text-app-text-muted bg-app-bg/30 rounded-3xl border-2 border-dashed border-app-border italic font-medium uppercase tracking-widest text-xs font-black">
                  Nenhum jogo gerado ainda. Vá para a aba "Classificação" ou
                  clique abaixo para começar.
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-4">
                  {champ.jogos?.map((game) => {
                    const isEditingTime = editingGameId === game.id;
                    return (
                      <div
                        key={game.id}
                        className="bg-app-bg/30 border border-app-border rounded-3xl p-6 flex flex-col md:flex-row items-center justify-between hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all gap-6 group shadow-sm"
                      >
                        <div className="flex-1 text-center md:text-right font-black text-app-text text-lg uppercase tracking-tight group-hover:text-blue-500 transition-colors">
                          {game.time_casa_nome}
                        </div>

                        <div className="flex flex-col items-center gap-3">
                          <div className="flex items-center gap-5 bg-app-bg/50 p-3 rounded-[2rem] border border-app-border shadow-inner">
                            <span
                              className={`text-4xl font-black w-14 h-14 flex items-center justify-center rounded-2xl ${game.status === "realizado" ? "bg-white dark:bg-zinc-800 text-app-text shadow-lg" : "bg-app-bg text-app-text-muted"}`}
                            >
                              {game.gols_casa ?? 0}
                            </span>
                            <span className="text-app-text-muted font-black text-xl italic tracking-tighter uppercase px-1">
                              VS
                            </span>
                            <span
                              className={`text-4xl font-black w-14 h-14 flex items-center justify-center rounded-2xl ${game.status === "realizado" ? "bg-white dark:bg-zinc-800 text-app-text shadow-lg" : "bg-app-bg text-app-text-muted"}`}
                            >
                              {game.gols_visitante ?? 0}
                            </span>
                          </div>
                          <div className="flex flex-col items-center gap-1">
                            {isEditingTime ? (
                              <div className="flex items-center gap-2 mt-1">
                                <input
                                  type="datetime-local"
                                  defaultValue={
                                    game.data_hora
                                      ? new Date(game.data_hora)
                                          .toISOString()
                                          .slice(0, 16)
                                      : ""
                                  }
                                  id={`datetimeInput-${game.id}`}
                                  className="bg-app-bg border border-app-border px-2 py-1.5 rounded-lg text-xs font-bold text-app-text focus:outline-none focus:ring-1 focus:ring-blue-500"
                                />
                                <button
                                  onClick={() => {
                                    const el = document.getElementById(
                                      `datetimeInput-${game.id}`,
                                    ) as HTMLInputElement;
                                    if (el && el.value) {
                                      handleSaveGameTime(game.id, el.value);
                                      setEditingGameId(null);
                                    }
                                  }}
                                  className="bg-blue-600 text-white text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-lg hover:bg-blue-700 transition"
                                >
                                  OK
                                </button>
                                <button
                                  onClick={() => setEditingGameId(null)}
                                  className="text-app-text-muted text-[10px] font-black uppercase tracking-widest px-2 py-1 hover:text-app-text"
                                >
                                  Voltar
                                </button>
                              </div>
                            ) : (
                              <div className="text-[10px] font-black text-app-text-muted uppercase tracking-widest flex items-center gap-2">
                                <span>Rodada {game.round}</span>
                                <span className="w-1 h-1 bg-app-border rounded-full"></span>
                                <span>
                                  {game.data_hora
                                    ? new Date(game.data_hora).toLocaleString(
                                        "pt-BR",
                                        {
                                          dateStyle: "short",
                                          timeStyle: "short",
                                        },
                                      )
                                    : "Partida Agendada"}
                                </span>
                                {game.status !== "realizado" && (
                                  <button
                                    onClick={() => {
                                      setEditingGameId(game.id);
                                    }}
                                    className="text-blue-500 hover:text-blue-700 font-bold ml-1 flex items-center gap-0.5 hover:underline"
                                    title="Editar Horário"
                                  >
                                    [Editar Horário]
                                  </button>
                                )}
                                <span className="w-1 h-1 bg-app-border rounded-full"></span>
                                {game.status === "realizado" ? (
                                  <span className="text-green-500 font-medium">
                                    Finalizado
                                  </span>
                                ) : (
                                  <span className="text-app-text-muted">
                                    Aguardando
                                  </span>
                                )}
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="flex-1 items-center flex justify-between w-full md:w-auto">
                          <div className="flex-1 text-center md:text-left font-black text-app-text text-lg uppercase tracking-tight group-hover:text-blue-500 transition-colors">
                            {game.time_visitante_nome}
                          </div>
                          {game.status !== "realizado" && (
                            <button
                              onClick={() => {
                                setSelectedGame(game);
                                setHomeGoals(0);
                                setAwayGoals(0);
                                setGameEvents([]);
                                setShowResultModal(true);
                              }}
                              className="ml-4 p-3 bg-blue-600 text-white rounded-2xl shadow-lg hover:scale-110 active:scale-95 transition-all"
                              title="Registrar Resultado"
                            >
                              <ClipboardCheck className="w-5 h-5" />
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {activeTab === "artilharia" && (
            <div className="space-y-6">
              <h2 className="text-xl font-black text-app-text uppercase tracking-tight">
                Mesa de Artilheiros
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {Array.isArray(scorers) &&
                  scorers.map((scorer, idx) => (
                    <div
                      key={scorer.id || idx}
                      className="bg-app-bg/30 border border-app-border rounded-[2.5rem] p-6 flex items-center gap-6 relative shadow-sm hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all group overflow-hidden"
                    >
                      <div className="absolute -top-2 -right-4 text-7xl font-black text-app-text/5 group-hover:text-amber-500/10 transition-colors italic">
                        {idx + 1}º
                      </div>
                      <div className="w-20 h-20 bg-amber-500/10 border-2 border-amber-500/20 rounded-3xl flex items-center justify-center relative overflow-hidden shadow-inner shrink-0 scale-90 group-hover:scale-100 transition-transform">
                        <Award className="w-10 h-10 text-amber-500" />
                      </div>
                      <div className="min-w-0">
                        <div className="text-lg font-black text-app-text uppercase tracking-tighter truncate">
                          {scorer.nome || "Jogador"}
                        </div>
                        <div className="text-4xl font-black text-amber-500 mt-1 flex items-baseline gap-2">
                          {scorer.gols || 0}{" "}
                          <span className="text-[10px] text-app-text-muted uppercase tracking-widest font-black italic">
                            Gols
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                {scorers.length === 0 && (
                  <div className="col-span-full py-20 text-center text-app-text-muted italic font-medium">
                    Nenhum gol registrado até o momento.
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === "cartoes" && (
            <div className="space-y-6">
              <h2 className="text-xl font-black text-app-text uppercase tracking-tight">
                Resumo de Cartões
              </h2>
              <div className="overflow-x-auto rounded-3xl border border-app-border bg-app-bg/20">
                <table className="w-full text-sm">
                  <thead className="bg-zinc-100 dark:bg-zinc-800/50 text-app-text-muted font-black uppercase text-[10px] tracking-widest">
                    <tr>
                      <th className="px-6 py-5 text-left">Jogador</th>
                      <th className="px-6 py-5 text-center">Amarelos</th>
                      <th className="px-6 py-5 text-center">Vermelhos</th>
                      <th className="px-6 py-5 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-app-border">
                    {Array.isArray(cards) &&
                      cards.map((c, idx) => (
                        <tr
                          key={c.id || idx}
                          className="hover:bg-app-bg/30 transition-colors"
                        >
                          <td className="px-6 py-5 font-black text-app-text uppercase tracking-tight">
                            {c.nome || "Jogador"}
                          </td>
                          <td className="px-6 py-5 text-center">
                            <span className="bg-yellow-500 w-8 h-10 inline-block rounded shadow-lg shadow-yellow-900/50 text-black flex items-center justify-center font-black text-lg">
                              {c.amarelos || 0}
                            </span>
                          </td>
                          <td className="px-6 py-5 text-center">
                            <span className="bg-red-600 w-8 h-10 inline-block rounded shadow-lg shadow-red-900/50 text-white flex items-center justify-center font-black text-lg">
                              {c.vermelhos || 0}
                            </span>
                          </td>
                          <td className="px-6 py-5 text-center">
                            {c.suspenso ? (
                              <span className="bg-red-500/10 text-red-500 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border border-red-500/20">
                                Suspenso
                              </span>
                            ) : (
                              <span className="bg-green-500/10 text-green-500 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border border-green-500/20">
                                Liberado
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    {(Array.isArray(cards) ? cards.length : 0) === 0 && (
                      <tr>
                        <td
                          colSpan={4}
                          className="py-20 text-center text-app-text-muted italic font-medium uppercase tracking-widest"
                        >
                          Nenhum cartão registrado.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === "times" && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
                <div>
                  <h2 className="text-xl font-black text-app-text uppercase tracking-tight">
                    Times e Atletas
                  </h2>
                  <p className="text-app-text-muted text-xs">
                    Gerencie os elencos de cada equipe no campeonato.
                  </p>
                </div>
                <button
                  onClick={() => setShowAddTeamModal(true)}
                  className="bg-blue-600 text-white px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest flex items-center shadow-lg hover:bg-blue-700 transition"
                >
                  <Plus className="w-4 h-4 mr-1.5" /> Adicionar Time
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {(champ.times || []).map((team) => (
                  <div
                    key={team.id}
                    className="bg-app-bg/10 border border-app-border rounded-3xl p-6 shadow-sm flex flex-col space-y-4"
                  >
                    <div className="flex justify-between items-center pb-3 border-b border-app-border">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-500/10 rounded-xl flex items-center justify-center text-blue-500 font-black text-lg">
                          {team.nome.charAt(0).toUpperCase()}
                        </div>
                        <span className="font-black text-app-text text-lg uppercase tracking-tight">
                          {team.nome}
                        </span>
                      </div>
                      <button
                        onClick={() => {
                          setSelectedTeamIdForPlayer(team.id);
                          setShowAddPlayerModal(true);
                        }}
                        className="bg-zinc-100 dark:bg-zinc-800 text-blue-500 text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-xl border border-blue-500/10 hover:bg-blue-500/5 transition flex items-center gap-1"
                      >
                        <Plus className="w-3.5 h-3.5" /> Jogador
                      </button>
                    </div>

                    <div className="min-h-16 flex flex-col justify-center">
                      {!team.players || team.players.length === 0 ? (
                        <span className="text-[10px] text-app-text-muted uppercase font-black tracking-widest text-center italic py-4">
                          Nenhum atleta cadastrado
                        </span>
                      ) : (
                        <div className="flex flex-wrap gap-2 py-2">
                          {team.players.map((plr, pIdx) => (
                            <div
                              key={pIdx}
                              className="bg-zinc-100 dark:bg-zinc-800/80 hover:bg-zinc-200 dark:hover:bg-zinc-850 border border-app-border px-3 py-1 rounded-2xl flex items-center justify-between text-xs font-bold text-app-text shadow-sm group"
                            >
                              <span className="mr-2 uppercase tracking-wide">
                                {plr}
                              </span>
                              <button
                                onClick={() =>
                                  handleRemovePlayerFromTeam(team.id, plr)
                                }
                                className="text-red-500 opacity-60 hover:opacity-100 transition-opacity ml-1 p-0.5 rounded-full hover:bg-red-500/10"
                                title="Remover"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                {(champ.times || []).length === 0 && (
                  <div className="col-span-full py-20 text-center text-app-text-muted border-2 border-dashed border-app-border rounded-3xl bg-app-bg/20 italic font-medium">
                    Nenhum time cadastrado para este campeonato.
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Result Modal */}
      {showResultModal &&
        selectedGame &&
        (() => {
          const homeTeamObj = champ.times.find(
            (t) => t.id === selectedGame.time_casa,
          );
          const awayTeamObj = champ.times.find(
            (t) => t.id === selectedGame.time_visitante,
          );

          const getTeamPlayersList = (teamObj: Team | undefined) => {
            if (!teamObj) return [];
            const list: string[] = [];
            if (teamObj.players && teamObj.players.length > 0) {
              teamObj.players.forEach((p) => {
                if (p && !list.includes(p)) list.push(p);
              });
            }
            if (teamObj.teamPlayers && teamObj.teamPlayers.length > 0) {
              teamObj.teamPlayers.forEach((tp) => {
                if (tp.playerName && !list.includes(tp.playerName)) {
                  list.push(tp.playerName);
                }
              });
            }
            return list;
          };

          return (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
              <div className="bg-app-card rounded-[3rem] w-full max-w-2xl border border-app-border shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
                <div className="p-8 border-b border-app-border flex items-center justify-between bg-app-bg/50">
                  <h2 className="text-2xl font-black text-app-text uppercase tracking-tighter italic">
                    Súmula do Jogo
                  </h2>
                  <button
                    onClick={() => setShowResultModal(false)}
                    className="p-3 text-app-text-muted hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-app-text rounded-2xl transition-all shadow-inner border border-app-border"
                  >
                    <X className="h-6 w-6" />
                  </button>
                </div>
                <div className="flex-1 overflow-y-auto p-8 space-y-8">
                  <div className="bg-black p-10 rounded-[2.5rem] text-white shadow-2xl border border-zinc-800">
                    <div className="grid grid-cols-3 items-center gap-8">
                      <div className="text-center space-y-3">
                        <div className="text-[10px] font-black text-zinc-500 uppercase tracking-widest px-2 py-1 bg-zinc-900 inline-block rounded-md border border-zinc-800">
                          CASA
                        </div>
                        <div className="text-2xl font-black truncate uppercase tracking-tighter italic text-blue-400">
                          {selectedGame.time_casa_nome}
                        </div>
                      </div>
                      <div className="flex items-center justify-center gap-6">
                        <input
                          type="number"
                          value={homeGoals}
                          onChange={(e) =>
                            setHomeGoals(parseInt(e.target.value) || 0)
                          }
                          className="w-20 h-24 bg-zinc-900 border-2 border-zinc-800 rounded-3xl text-center text-5xl font-black focus:outline-none focus:ring-4 focus:ring-blue-500/30 transition-all text-white shadow-inner"
                        />
                        <span className="text-3xl font-black text-zinc-800 italic select-none">
                          VS
                        </span>
                        <input
                          type="number"
                          value={awayGoals}
                          onChange={(e) =>
                            setAwayGoals(parseInt(e.target.value) || 0)
                          }
                          className="w-20 h-24 bg-zinc-900 border-2 border-zinc-800 rounded-3xl text-center text-5xl font-black focus:outline-none focus:ring-4 focus:ring-blue-500/30 transition-all text-white shadow-inner"
                        />
                      </div>
                      <div className="text-center space-y-3">
                        <div className="text-[10px] font-black text-zinc-500 uppercase tracking-widest px-2 py-1 bg-zinc-900 inline-block rounded-md border border-zinc-800">
                          FORA
                        </div>
                        <div className="text-2xl font-black truncate uppercase tracking-tighter italic text-red-400">
                          {selectedGame.time_visitante_nome}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-app-bg/50 border border-app-border rounded-3xl p-6 space-y-4 shadow-inner">
                    <h4 className="text-xs font-black text-app-text uppercase tracking-[0.2em] flex items-center gap-2">
                      <Plus className="w-4 h-4 text-blue-500 animate-pulse" /> Registrar Lance (Gols / Cartões)
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      {/* Team Selector */}
                      <div>
                        <label className="block text-[10px] font-black text-app-text-muted uppercase tracking-widest mb-1.5 font-bold">Time</label>
                        <select
                          value={eventTeam || "casa"}
                          onChange={(e) => {
                            const teamType = e.target.value as 'casa' | 'fora';
                            setEventTeam(teamType);
                            setEventPlayer("");
                          }}
                          className="w-full bg-zinc-100 dark:bg-zinc-900 border border-app-border px-4 py-3 rounded-2xl text-xs font-bold text-app-text focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                        >
                          <option value="casa">{selectedGame.time_casa_nome} (Casa)</option>
                          <option value="fora">{selectedGame.time_visitante_nome} (Fora)</option>
                        </select>
                      </div>

                      {/* Event Type Selector */}
                      <div>
                        <label className="block text-[10px] font-black text-app-text-muted uppercase tracking-widest mb-1.5 font-bold">Tipo de Lance</label>
                        <select
                          value={eventType || "gol"}
                          onChange={(e) => setEventType(e.target.value as any)}
                          className="w-full bg-zinc-100 dark:bg-zinc-900 border border-app-border px-4 py-3 rounded-2xl text-xs font-bold text-app-text focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                        >
                          <option value="gol">⚽ Gol</option>
                          <option value="cartao_amarelo">🟨 Cartão Amarelo</option>
                          <option value="cartao_vermelho">🟥 Cartão Vermelho</option>
                        </select>
                      </div>

                      {/* Player Selector */}
                      <div>
                        <label className="block text-[10px] font-black text-app-text-muted uppercase tracking-widest mb-1.5 font-bold">Atleta</label>
                        <div className="flex gap-2">
                          {eventPlayer !== "custom" ? (
                            <select
                              value={eventPlayer}
                              onChange={(e) => setEventPlayer(e.target.value)}
                              className="w-full bg-zinc-100 dark:bg-zinc-900 border border-app-border px-4 py-3 rounded-2xl text-xs font-bold text-app-text focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                            >
                              <option value="">-- Selecione o Atleta --</option>
                              {getTeamPlayersList(eventTeam === 'casa' ? homeTeamObj : awayTeamObj).map((pName) => {
                                const activeRoster = eventTeam === 'casa' ? homeTeamObj?.teamPlayers : awayTeamObj?.teamPlayers;
                                const matchedTp = activeRoster?.find(tp => tp.playerName.toLowerCase() === pName.toLowerCase());
                                const value = matchedTp ? matchedTp.playerId : pName;
                                return (
                                  <option key={pName} value={value}>
                                    {pName}
                                  </option>
                                );
                              })}
                              <option value="custom font-bold">+ Outro Atleta (Digitar)</option>
                            </select>
                          ) : (
                            <div className="flex gap-1 w-full">
                              <input
                                type="text"
                                placeholder="Digite o nome..."
                                value={customPlayerName}
                                onChange={(e) => setCustomPlayerName(e.target.value)}
                                className="flex-1 bg-zinc-100 dark:bg-zinc-900 border border-app-border px-4 py-3 rounded-2xl text-xs font-bold text-app-text focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                              />
                              <button
                                type="button"
                                onClick={() => {
                                  setEventPlayer("");
                                  setCustomPlayerName("");
                                }}
                                className="px-2 text-xs font-black uppercase tracking-wider text-red-500/80 hover:text-red-500 transition-colors"
                              >
                                X
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-end pt-2">
                      <button
                        type="button"
                        onClick={async () => {
                          let playerId = "";
                          let playerName = "";
                          const teamId = eventTeam === 'casa' ? selectedGame.time_casa : selectedGame.time_visitante;
                          
                          if (eventPlayer === "custom") {
                            if (!customPlayerName.trim()) {
                              toast.error("Por favor, digite o nome do jogador.");
                              return;
                            }
                            try {
                              const resp = await api.post(`/championships/${id}/times/${teamId}/jogadores`, { playerName: customPlayerName });
                              toast.success(`Jogador "${customPlayerName}" cadastrado no time!`);
                              await fetchChamp();
                              
                              // Find player by name in championship database
                              const updatedChamp = await api.get(`/championships/${id}`);
                              const updatedTeamObj = updatedChamp.data.times.find((t: any) => t.id === teamId);
                              const foundTp = updatedTeamObj.teamPlayers?.find((tp: any) => tp.playerName === customPlayerName);
                              if (foundTp) {
                                playerId = foundTp.playerId;
                                playerName = foundTp.playerName;
                              } else {
                                playerId = `local_p_${Math.random().toString(36).substr(2, 5)}`;
                                playerName = customPlayerName;
                              }
                            } catch (e) {
                              playerId = `local_p_${Math.random().toString(36).substr(2, 5)}`;
                              playerName = customPlayerName;
                            }
                          } else {
                            if (!eventPlayer) {
                              toast.error("Por favor, selecione um jogador.");
                              return;
                            }
                            const activeRoster = eventTeam === 'casa' ? homeTeamObj?.teamPlayers : awayTeamObj?.teamPlayers;
                            const selectedTp = activeRoster?.find(tp => tp.playerId === eventPlayer);
                            if (selectedTp) {
                              playerId = selectedTp.playerId;
                              playerName = selectedTp.playerName;
                            } else {
                              const matchedByName = activeRoster?.find(tp => tp.playerName.toLowerCase() === eventPlayer.toLowerCase());
                              if (matchedByName) {
                                playerId = matchedByName.playerId;
                                playerName = matchedByName.playerName;
                              } else {
                                try {
                                  const resp = await api.post(`/championships/${id}/times/${teamId}/jogadores`, { playerName: eventPlayer });
                                  await fetchChamp();
                                  
                                  const updatedChamp = await api.get(`/championships/${id}`);
                                  const updatedTeamObj = updatedChamp.data.times.find((t: any) => t.id === teamId);
                                  const foundTp = updatedTeamObj?.teamPlayers?.find((tp: any) => tp.playerName.toLowerCase() === eventPlayer.toLowerCase());
                                  if (foundTp) {
                                    playerId = foundTp.playerId;
                                    playerName = foundTp.playerName;
                                  } else {
                                    playerId = `local_p_${Math.random().toString(36).substr(2, 5)}`;
                                    playerName = eventPlayer;
                                  }
                                } catch (err) {
                                  playerId = `local_p_${Math.random().toString(36).substr(2, 5)}`;
                                  playerName = eventPlayer;
                                }
                              }
                            }
                          }
                          
                          setGameEvents(prev => [...prev, {
                            tipo: eventType,
                            jogadorId: playerId,
                            jogadorNome: playerName,
                            timeId: teamId,
                            minuto: 0
                          }]);
                          
                          if (eventType === 'gol') {
                            if (eventTeam === 'casa') setHomeGoals(prev => prev + 1);
                            else setAwayGoals(prev => prev + 1);
                          }
                          
                          setEventPlayer("");
                          setCustomPlayerName("");
                          toast.success("Lance adicionado!");
                        }}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition shadow-lg active:scale-95"
                      >
                        Adicionar Evento
                      </button>
                    </div>
                  </div>


                </div>
                <div className="p-8 bg-zinc-100 dark:bg-zinc-950/80 border-t border-app-border backdrop-blur-sm">
                  <button
                    onClick={async () => {
                      try {
                        await api.post(
                          `/championships/${id}/jogos/${selectedGame.id}/registrar`,
                          {
                            gols_casa: homeGoals,
                            gols_visitante: awayGoals,
                            eventos: gameEvents,
                          },
                        );
                        toast.success("Resultado finalizado!");
                        setShowResultModal(false);
                        fetchChamp();
                        fetchStandings();
                        fetchScorers();
                        fetchCards();
                      } catch (e) {
                        if (champ) {
                          const updatedJogos = champ.jogos.map((g: Game) => {
                            if (g.id === selectedGame.id) {
                              return {
                                ...g,
                                gols_casa: homeGoals,
                                gols_visitante: awayGoals,
                                status: "realizado",
                                eventos: gameEvents,
                              };
                            }
                            return g;
                          });

                          const nChamp = { ...champ, jogos: updatedJogos };
                          setChamp(nChamp);
                          updateLocalChamp(nChamp);
                          toast.success("Resultado finalizado localmente!");
                          setShowResultModal(false);
                          recalculateLocalStats(nChamp);
                        } else {
                          toast.error("Erro ao salvar resultado.");
                        }
                      }
                    }}
                    className="w-full bg-blue-600 text-white py-5 rounded-[2rem] font-black text-xl shadow-2xl shadow-blue-900/40 hover:bg-blue-700 hover:scale-[1.02] active:scale-95 transition-all uppercase tracking-widest border-t border-blue-400/20"
                  >
                    SALVAR RESULTADO
                  </button>
                </div>
              </div>
            </div>
          );
        })()}
      {/* Table Preview & Confirmation Modal */}
      {showPreviewModal && champ && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
          <div className="bg-app-card rounded-[3rem] w-full max-w-2xl border border-app-border shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-8 border-b border-app-border flex items-center justify-between bg-app-bg/50">
              <div>
                <h2 className="text-2xl font-black text-app-text uppercase tracking-tighter italic">
                  Preview dos Confrontos
                </h2>
                <p className="text-xs text-app-text-muted">
                  Confira as rodadas antes de confirmar a geração final.
                </p>
              </div>
              <button
                onClick={() => setShowPreviewModal(false)}
                className="p-3 text-app-text-muted hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-app-text rounded-2xl transition-all shadow-inner border border-app-border"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-8 space-y-6">
              {champ.times.length < 2 ? (
                <div className="text-center py-10 text-red-500 font-bold uppercase tracking-wider text-sm p-4 bg-red-500/10 border border-red-500/20 rounded-2xl">
                  Adicione pelo menos 2 times para gerar a tabela de jogos!
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="bg-blue-500/10 border border-blue-500/20 px-6 py-4 rounded-2xl flex items-center justify-between">
                    <span className="text-xs font-black text-blue-500 uppercase tracking-widest">
                      Informações do Campeonato
                    </span>
                    <span className="text-xs font-black text-app-text uppercase tracking-widest bg-zinc-200 dark:bg-zinc-800 px-3 py-1 rounded-full border border-app-border">
                      {champ.formato?.replace("_", " ") || "Simples"} -{" "}
                      {champ.jogos_ida_volta ? "Ida e Volta" : "Apenas Ida"}
                    </span>
                  </div>

                  {Object.entries(
                    getTablePreview().reduce(
                      (acc, match) => {
                        if (!acc[match.round]) acc[match.round] = [];
                        acc[match.round].push(match);
                        return acc;
                      },
                      {} as Record<number, any[]>,
                    ),
                  ).map(([round, matches]) => (
                    <div key={round} className="space-y-3">
                      <h3 className="text-xs font-black text-app-text-muted uppercase tracking-[0.2em] px-2 italic">
                        Rodada {round}
                      </h3>
                      <div className="grid grid-cols-1 gap-2">
                        {matches.map((m, mIdx) => (
                          <div
                            key={mIdx}
                            className="bg-zinc-50 dark:bg-zinc-950 px-6 py-4 rounded-2xl border border-app-border flex items-center justify-between text-sm shadow-sm hover:scale-[1.01] transition-transform"
                          >
                            <span className="font-bold text-app-text uppercase tracking-tight text-center flex-1">
                              {m.home}
                            </span>
                            <span className="text-[10px] font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-widest px-3 py-1 bg-zinc-100 dark:bg-zinc-800 rounded-full border border-app-border mx-4">
                              VS
                            </span>
                            <span className="font-bold text-app-text uppercase tracking-tight text-center flex-1">
                              {m.away}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="p-8 bg-zinc-100 dark:bg-zinc-950/80 border-t border-app-border backdrop-blur-sm flex gap-4">
              <button
                onClick={() => setShowPreviewModal(false)}
                className="flex-1 bg-zinc-200 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 py-4 rounded-2xl font-black text-sm uppercase tracking-wider hover:bg-zinc-300 dark:hover:bg-zinc-700 transition"
              >
                Voltar
              </button>
              {champ.times.length >= 2 && (
                <button
                  onClick={handleGenerateTable}
                  className="flex-[2] bg-green-600 text-white py-4 rounded-2xl font-black text-sm uppercase tracking-wider shadow-lg shadow-green-900/10 hover:bg-green-700 transition"
                >
                  Confirmar e Gerar Jogos!
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Team Modal */}
      {showAddTeamModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
          <div className="bg-app-card rounded-[2.5rem] w-full max-w-md border border-app-border shadow-2xl overflow-hidden flex flex-col p-8 space-y-6">
            <div className="flex items-center justify-between border-b border-app-border pb-4">
              <h3 className="text-xl font-black text-app-text uppercase tracking-tighter">
                Cadastrar Novo Time
              </h3>
              <button
                onClick={() => {
                  setShowAddTeamModal(false);
                  setNewTeamName("");
                }}
                className="text-app-text-muted hover:text-app-text transition p-1 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-[10px] font-black text-app-text-muted uppercase tracking-widest mb-1.5 font-bold">
                  Nome do Time
                </label>
                <input
                  type="text"
                  value={newTeamName}
                  onChange={(e) => setNewTeamName(e.target.value)}
                  placeholder="Ex: Real Madrid, Barcelona..."
                  className="w-full bg-zinc-100 dark:bg-zinc-900 border border-app-border px-4 py-3 rounded-2xl text-xs font-bold text-app-text placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={() => {
                  setShowAddTeamModal(false);
                  setNewTeamName("");
                }}
                className="flex-1 bg-zinc-200 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 py-3.5 rounded-xl font-black text-xs uppercase tracking-wider hover:bg-zinc-300 dark:hover:bg-zinc-700 transition"
              >
                Cancelar
              </button>
              <button
                onClick={handleAddNewTeam}
                className="flex-1 bg-blue-600 text-white py-3.5 rounded-xl font-black text-xs uppercase tracking-wider hover:bg-blue-700 shadow-lg shadow-blue-950/20 active:scale-95 transition"
              >
                Cadastrar Time
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Player Modal */}
      {showAddPlayerModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
          <div className="bg-app-card rounded-[2.5rem] w-full max-w-md border border-app-border shadow-2xl overflow-hidden flex flex-col p-8 space-y-6">
            <div className="flex items-center justify-between border-b border-app-border pb-4">
              <h3 className="text-xl font-black text-app-text uppercase tracking-tighter">
                Cadastrar Novo Atleta
              </h3>
              <button
                onClick={() => {
                  setShowAddPlayerModal(false);
                  setNewPlayerName("");
                }}
                className="text-app-text-muted hover:text-app-text transition p-1 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-[10px] font-black text-app-text-muted uppercase tracking-widest mb-1.5 font-bold">
                  Nome do Atleta
                </label>
                <input
                  type="text"
                  value={newPlayerName}
                  onChange={(e) => setNewPlayerName(e.target.value)}
                  placeholder="Ex: Neymar Jr, Cristiano..."
                  className="w-full bg-zinc-100 dark:bg-zinc-900 border border-app-border px-4 py-3 rounded-2xl text-xs font-bold text-app-text placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={() => {
                  setShowAddPlayerModal(false);
                  setNewPlayerName("");
                }}
                className="flex-1 bg-zinc-200 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 py-3.5 rounded-xl font-black text-xs uppercase tracking-wider hover:bg-zinc-300 dark:hover:bg-zinc-700 transition"
              >
                Cancelar
              </button>
              <button
                onClick={handleAddNewPlayer}
                className="flex-1 bg-blue-600 text-white py-3.5 rounded-xl font-black text-xs uppercase tracking-wider hover:bg-blue-700 shadow-lg shadow-blue-950/20 active:scale-95 transition"
              >
                Cadastrar Atleta
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChampionshipDetail;
