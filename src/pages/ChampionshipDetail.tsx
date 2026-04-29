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
  X
} from "lucide-react";
import api from "../services/api";
import { toast } from "react-hot-toast";

interface Team {
  id: string;
  nome: string;
}

interface Game {
  id: string;
  time_casa_nome: string;
  time_visitante_nome: string;
  gols_casa: number;
  gols_visitante: number;
  data_hora: string;
  status: string;
}

interface Championship {
  id: string;
  nome: string;
  formato: string;
  data_inicio: string;
  times: Team[];
  jogos: Game[];
}

const ChampionshipDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [champ, setChamp] = useState<Championship | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'tabela' | 'jogos' | 'times' | 'artilharia' | 'cartoes'>('tabela');
  const [standings, setStandings] = useState<any[]>([]);
  const [scorers, setScorers] = useState<any[]>([]);
  const [cards, setCards] = useState<any[]>([]);
  const [showResultModal, setShowResultModal] = useState(false);

  useEffect(() => {
    fetchChamp();
    if (activeTab === 'tabela') fetchStandings();
    if (activeTab === 'artilharia') fetchScorers();
    if (activeTab === 'cartoes') fetchCards();
  }, [id, activeTab]);

  const fetchCards = async () => {
    try {
      const resp = await api.get(`/campeonatos/${id}/cartoes`);
      setCards(resp.data);
    } catch (e) {}
  };
  const [selectedGame, setSelectedGame] = useState<Game | null>(null);
  
  const [homeGoals, setHomeGoals] = useState(0);
  const [awayGoals, setAwayGoals] = useState(0);
  const [gameEvents, setGameEvents] = useState<any[]>([]);

  useEffect(() => {
    fetchChamp();
    if (activeTab === 'tabela') fetchStandings();
    if (activeTab === 'artilharia') fetchScorers();
  }, [id, activeTab]);

  const fetchStandings = async () => {
    try {
      const resp = await api.get(`/campeonatos/${id}/classificacao`);
      setStandings(resp.data);
    } catch (e) {}
  };

  const fetchScorers = async () => {
    try {
      const resp = await api.get(`/campeonatos/${id}/artilharia`);
      setScorers(resp.data);
    } catch (e) {}
  };

  const fetchChamp = async () => {
    try {
      const response = await api.get(`/campeonatos/${id}/`);
      setChamp(response.data);
    } catch (error) {
      toast.error("Erro ao carregar campeonato.");
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateTable = async () => {
    try {
      await api.post(`/campeonatos/${id}/gerar_tabela/`);
      toast.success("Tabela gerada com sucesso!");
      fetchChamp();
    } catch (error) {
      toast.error("Erro ao gerar tabela.");
    }
  };

  const handleAddTeam = async () => {
    const nome = prompt("Nome do Time:");
    if (!nome) return;
    try {
      // Small hack for demo: we can't easily add to a list in mock without a specific endpoint
      // but Champ model has 'times' relation. In Django it's a separate model.
      await api.post(`/campeonatos/${id}/times/`, { nome });
      toast.success("Time adicionado!");
      fetchChamp();
    } catch (error) {
      toast.error("Erro ao adicionar time.");
    }
  };

  if (loading) return <div className="flex justify-center p-12"><Loader2 className="animate-spin" /></div>;
  if (!champ) return <div className="p-12 text-center text-gray-500">Campeonato não encontrado.</div>;

  // Calculate table (mock)
  const sortedTimes = [...(champ.times || [])].sort((a,b) => 0); // Simplified for now

  return (
    <div className="space-y-6">
       <button 
        onClick={() => navigate("/championships")}
        className="flex items-center text-gray-600 hover:text-green-600 transition"
      >
        <ChevronLeft className="w-4 h-4 mr-1" /> Voltar para Campeonatos
      </button>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-5">
           <Trophy className="w-40 h-40" />
        </div>
        <div className="relative z-10">
          <h1 className="text-3xl font-black text-gray-900">{champ.nome}</h1>
          <div className="flex gap-4 mt-2">
            <span className="text-sm text-gray-500 flex items-center bg-gray-50 px-3 py-1 rounded-full">
              <Calendar className="w-4 h-4 mr-1" />
              Início: {new Date(champ.data_inicio).toLocaleDateString()}
            </span>
            <span className="text-sm text-gray-500 flex items-center bg-gray-50 px-3 py-1 rounded-full capitalize">
              <Settings className="w-4 h-4 mr-1" />
              {champ.formato.replace('_', ' ')}
            </span>
          </div>

          <div className="mt-8 flex gap-2 overflow-x-auto pb-2">
            {[
              { id: 'tabela', icon: TableIcon, label: 'Classificação' },
              { id: 'jogos', icon: Play, label: 'Tabela de Jogos' },
              { id: 'artilharia', icon: Award, label: 'Artilharia' },
              { id: 'cartoes', icon: ClipboardCheck, label: 'Cartões' },
              { id: 'times', icon: Users, label: 'Times' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center px-6 py-2 rounded-full text-sm font-bold transition whitespace-nowrap ${
                  activeTab === tab.id ? 'bg-blue-600 text-white shadow-md' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
                }`}
              >
                <tab.icon className="w-4 h-4 mr-2" />
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
        {activeTab === 'tabela' && (
          <div className="space-y-4">
             <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold">Classificação Atual</h2>
                {champ.jogos.length === 0 && (
                   <button 
                     onClick={handleGenerateTable}
                     className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center shadow-lg hover:bg-green-700 transition"
                   >
                     <Play className="w-4 h-4 mr-2" />
                     Gerar Todos os Jogos
                   </button>
                )}
             </div>
             <div className="overflow-x-auto">
               <table className="w-full text-sm">
                  <thead className="bg-gray-50 font-bold text-gray-600 uppercase text-[10px] tracking-widest border-b border-gray-100">
                    <tr>
                      <th className="px-4 py-4 text-left">POS</th>
                      <th className="px-4 py-4 text-left">TIME</th>
                      <th className="px-4 py-4 text-center">PTS</th>
                      <th className="px-4 py-4 text-center">PJ</th>
                      <th className="px-4 py-4 text-center">V</th>
                      <th className="px-4 py-4 text-center">E</th>
                      <th className="px-4 py-4 text-center">D</th>
                      <th className="px-4 py-4 text-center">GP</th>
                      <th className="px-4 py-4 text-center">GC</th>
                      <th className="px-4 py-4 text-center">SG</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {(standings.length > 0 ? standings : champ.times).map((team, idx) => (
                      <tr key={team.id} className="hover:bg-gray-50 transition group">
                        <td className="px-4 py-4 font-bold text-gray-400">{idx + 1}º</td>
                        <td className="px-4 py-4 font-black text-gray-900 group-hover:text-blue-600 transition">{team.nome}</td>
                        <td className="px-4 py-4 text-center font-black text-blue-600 text-base">{team.pts || 0}</td>
                        <td className="px-4 py-4 text-center font-medium">{team.pj || 0}</td>
                        <td className="px-4 py-4 text-center font-medium text-green-600">{team.v || 0}</td>
                        <td className="px-4 py-4 text-center font-medium text-gray-500">{team.e || 0}</td>
                        <td className="px-4 py-4 text-center font-medium text-red-600">{team.d || 0}</td>
                        <td className="px-4 py-4 text-center font-medium">{team.gp || 0}</td>
                        <td className="px-4 py-4 text-center font-medium">{team.gc || 0}</td>
                        <td className={`px-4 py-4 text-center font-bold ${Number(team.sg) > 0 ? 'text-green-600' : Number(team.sg) < 0 ? 'text-red-600' : 'text-gray-400'}`}>
                          {team.sg || 0}
                        </td>
                      </tr>
                    ))}
                  </tbody>
               </table>
             </div>
          </div>
        )}

        {activeTab === 'jogos' && (
          <div className="space-y-6">
             <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold">Calendário e Resultados</h2>
             </div>
             {champ.jogos.length === 0 ? (
                <div className="text-center py-12 text-gray-400 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-100">Nenhum jogo gerado. Vá para a aba "Classificação" para gerar.</div>
             ) : (
                <div className="grid grid-cols-1 gap-3">
                   {champ.jogos.map(game => (
                      <div key={game.id} className="bg-white border border-gray-100 rounded-2xl p-6 flex flex-col md:flex-row items-center justify-between hover:shadow-lg transition gap-6 group">
                         <div className="flex-1 text-center md:text-right font-black text-gray-900 text-lg uppercase tracking-tight">{game.time_casa_nome}</div>
                         <div className="flex flex-col items-center gap-2">
                            <div className="flex items-center gap-4 bg-gray-50 p-2 rounded-2xl border border-gray-100">
                               <span className={`text-3xl font-black w-14 h-14 flex items-center justify-center rounded-xl ${game.status === 'realizado' ? 'bg-white shadow-sm' : 'bg-gray-100 text-gray-400'}`}>
                                 {game.gols_casa}
                               </span>
                               <span className="text-gray-300 font-black text-xl italic group-hover:scale-110 transition">VS</span>
                               <span className={`text-3xl font-black w-14 h-14 flex items-center justify-center rounded-xl ${game.status === 'realizado' ? 'bg-white shadow-sm' : 'bg-gray-100 text-gray-400'}`}>
                                 {game.gols_visitante}
                               </span>
                            </div>
                            <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{new Date(game.data_hora).toLocaleDateString()} - {game.status === 'realizado' ? 'Finalizado' : 'Aguardando'}</div>
                         </div>
                         <div className="flex-1 items-center flex justify-between w-full md:w-auto">
                            <div className="flex-1 text-center md:text-left font-black text-gray-900 text-lg uppercase tracking-tight">{game.time_visitante_nome}</div>
                            {game.status !== 'realizado' && (
                               <button 
                                 onClick={() => {
                                   setSelectedGame(game);
                                   setHomeGoals(0);
                                   setAwayGoals(0);
                                   setGameEvents([]);
                                   setShowResultModal(true);
                                 }}
                                 className="ml-4 p-2 bg-blue-600 text-white rounded-xl shadow-lg hover:scale-110 transition"
                                 title="Registrar Resultado"
                               >
                                 <ClipboardCheck className="w-5 h-5" />
                               </button>
                            )}
                         </div>
                      </div>
                   ))}
                </div>
             )}
          </div>
        )}

        {activeTab === 'artilharia' && (
            <div className="space-y-6">
                <h2 className="text-xl font-bold">Mesa de Artilheiros</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {scorers.map((scorer, idx) => (
                        <div key={scorer.id} className="bg-white border border-gray-100 rounded-3xl p-6 flex items-center gap-6 relative shadow-sm hover:shadow-xl transition group">
                            <div className="absolute top-4 right-4 text-4xl font-black text-gray-50 group-hover:text-amber-500/10 transition">{idx + 1}º</div>
                            <div className="w-16 h-16 bg-amber-50 border-2 border-amber-100 rounded-2xl flex items-center justify-center relative overflow-hidden">
                                <Award className="w-8 h-8 text-amber-500" />
                            </div>
                            <div>
                                <div className="text-xl font-black text-gray-900 uppercase tracking-tight">{scorer.nome}</div>
                                <div className="text-3xl font-black text-amber-500 mt-1 flex items-center gap-2">
                                    {scorer.gols} <span className="text-xs text-gray-400 uppercase tracking-widest font-bold">Gols</span>
                                </div>
                            </div>
                        </div>
                    ))}
                    {scorers.length === 0 && <div className="col-span-full py-12 text-center text-gray-400 italic">Nenhum gol registrado até o momento.</div>}
                </div>
            </div>
        )}

        {activeTab === 'cartoes' && (
            <div className="space-y-6">
                <h2 className="text-xl font-bold">Resumo de Cartões</h2>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead className="bg-gray-50 text-gray-500 font-bold uppercase text-[10px] tracking-widest">
                            <tr>
                                <th className="px-6 py-4 text-left">Jogador</th>
                                <th className="px-6 py-4 text-center">Amarelos</th>
                                <th className="px-6 py-4 text-center">Vermelhos</th>
                                <th className="px-6 py-4 text-center">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {cards.map(c => (
                                <tr key={c.id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 font-bold text-gray-900">{c.nome}</td>
                                    <td className="px-6 py-4 text-center text-yellow-500 font-black">{c.amarelos}</td>
                                    <td className="px-6 py-4 text-center text-red-600 font-black">{c.vermelhos}</td>
                                    <td className="px-6 py-4 text-center">
                                        {c.suspenso ? (
                                            <span className="bg-red-100 text-red-700 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter">Suspenso</span>
                                        ) : (
                                            <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter">Liberado</span>
                                        )}
                                    </td>
                                </tr>
                            ))}
                            {cards.length === 0 && <tr><td colSpan={4} className="py-12 text-center text-gray-400">Nenhum cartão registrado.</td></tr>}
                        </tbody>
                    </table>
                </div>
            </div>
        )}
        {activeTab === 'times' && (
          <div className="space-y-4">
             <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-gray-900">Times Participantes</h2>
                <button 
                  onClick={handleAddTeam}
                  className="text-blue-600 text-sm font-bold flex items-center hover:bg-blue-50 px-3 py-1 rounded-lg transition"
                >
                  <Plus className="w-4 h-4 mr-1" /> Adicionar Time
                </button>
             </div>
             <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
               {champ.times.map(team => (
                 <div key={team.id} className="p-4 border border-gray-100 rounded-xl flex items-center gap-4 hover:bg-gray-50 cursor-pointer transition">
                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-black">
                       {team.nome.charAt(0).toUpperCase()}
                    </div>
                    <div className="font-bold text-gray-800">{team.nome}</div>
                 </div>
               ))}
               {champ.times.length === 0 && (
                 <div className="col-span-full py-12 text-center text-gray-400">Nenhum time cadastrado.</div>
               )}
             </div>
          </div>
        )}
      </div>

      {/* Result Modal */}
      {showResultModal && selectedGame && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-[2.5rem] w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
             <div className="p-8 border-b border-gray-100 flex items-center justify-between bg-gray-50">
                <h2 className="text-2xl font-black text-gray-900 uppercase tracking-tighter">Súmula do Jogo</h2>
                <button onClick={() => setShowResultModal(false)} className="p-2 text-gray-400 hover:bg-white hover:text-gray-600 rounded-2xl transition shadow-sm"><X className="h-6 w-6" /></button>
             </div>
             <div className="flex-1 overflow-y-auto p-8 space-y-8">
                <div className="grid grid-cols-3 items-center gap-4 bg-gray-900 p-8 rounded-3xl text-white">
                   <div className="text-center">
                      <div className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Casa</div>
                      <div className="text-xl font-black truncate">{selectedGame.time_casa_nome}</div>
                   </div>
                   <div className="flex items-center justify-center gap-4">
                      <input 
                        type="number" 
                        value={homeGoals}
                        onChange={(e) => setHomeGoals(parseInt(e.target.value) || 0)}
                        className="w-16 h-16 bg-white/10 border border-white/20 rounded-2xl text-center text-3xl font-black focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                      />
                      <span className="text-2xl font-black text-gray-600 italic">X</span>
                      <input 
                        type="number" 
                        value={awayGoals}
                        onChange={(e) => setAwayGoals(parseInt(e.target.value) || 0)}
                        className="w-16 h-16 bg-white/10 border border-white/20 rounded-2xl text-center text-3xl font-black focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                      />
                   </div>
                   <div className="text-center">
                      <div className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Fora</div>
                      <div className="text-xl font-black truncate">{selectedGame.time_visitante_nome}</div>
                   </div>
                </div>

                   <div className="grid grid-cols-2 gap-4">
                      <button 
                        onClick={async () => {
                           const nome = prompt("Nome do Jogador:");
                           if (!nome) return;
                           const allPlayers = await api.get('/jogadores');
                           const p = (allPlayers.data as any[]).find(p => p.nome.toLowerCase().includes(nome.toLowerCase()));
                           if (p) {
                               const tipo = confirm("OK para Amarelo, Cancelar para Vermelho") ? 'ca' : 'cv';
                               setGameEvents([...gameEvents, { tipo: tipo === 'ca' ? 'cartao_amarelo' : 'cartao_vermelho', jogadorId: p.id, jogadorNome: p.nome, timeId: selectedGame.time_casa }]);
                           }
                        }}
                        className="p-4 rounded-2xl border-2 border-dashed border-gray-200 text-gray-500 font-bold hover:bg-gray-50 transition"
                      >
                         + Cartão {selectedGame.time_casa_nome}
                      </button>
                      <button 
                        onClick={async () => {
                            const nome = prompt("Nome do Jogador:");
                            if (!nome) return;
                            const allPlayers = await api.get('/jogadores');
                            const p = (allPlayers.data as any[]).find(p => p.nome.toLowerCase().includes(nome.toLowerCase()));
                            if (p) {
                                const tipo = confirm("OK para Amarelo, Cancelar para Vermelho") ? 'ca' : 'cv';
                                setGameEvents([...gameEvents, { tipo: tipo === 'ca' ? 'cartao_amarelo' : 'cartao_vermelho', jogadorId: p.id, jogadorNome: p.nome, timeId: selectedGame.time_visitante }]);
                            }
                        }}
                        className="p-4 rounded-2xl border-2 border-dashed border-gray-200 text-gray-500 font-bold hover:bg-gray-50 transition"
                      >
                         + Cartão {selectedGame.time_visitante_nome}
                      </button>
                   </div>
                   
                   <div className="space-y-4">
                      <h3 className="text-sm font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                       <Award className="w-4 h-4" /> Registrar Gols
                   </h3>
                   <div className="grid grid-cols-2 gap-4">
                      <button 
                        onClick={async () => {
                           const nome = prompt("Nome do artilheiro (ou ID):");
                           if (!nome) return;
                           // Fetch a list of players for real production, here we use simulation
                           const allPlayers = await api.get('/jogadores');
                           const p = (allPlayers.data as any[]).find(p => p.nome.toLowerCase().includes(nome.toLowerCase()));
                           if (p) {
                               setGameEvents([...gameEvents, { tipo: 'gol', jogadorId: p.id, jogadorNome: p.nome, timeId: selectedGame.time_casa }]);
                               setHomeGoals(prev => prev + 1);
                           } else { toast.error("Jogador não encontrado."); }
                        }}
                        className="p-4 rounded-2xl border-2 border-dashed border-gray-200 text-gray-500 font-bold hover:bg-gray-50 transition hover:border-gray-300"
                      >
                         + Gol {selectedGame.time_casa_nome}
                      </button>
                      <button 
                        onClick={async () => {
                            const nome = prompt("Nome do artilheiro (ou ID):");
                            if (!nome) return;
                            const allPlayers = await api.get('/jogadores');
                            const p = (allPlayers.data as any[]).find(p => p.nome.toLowerCase().includes(nome.toLowerCase()));
                            if (p) {
                                setGameEvents([...gameEvents, { tipo: 'gol', jogadorId: p.id, jogadorNome: p.nome, timeId: selectedGame.time_visitante }]);
                                setAwayGoals(prev => prev + 1);
                            } else { toast.error("Jogador não encontrado."); }
                        }}
                        className="p-4 rounded-2xl border-2 border-dashed border-gray-200 text-gray-500 font-bold hover:bg-gray-50 transition hover:border-gray-300"
                      >
                         + Gol {selectedGame.time_visitante_nome}
                      </button>
                   </div>
                   
                   <div className="space-y-2">
                      {gameEvents.map((e, idx) => (
                        <div key={idx} className="flex items-center justify-between bg-blue-50 px-4 py-3 rounded-xl border border-blue-100">
                           <div className="flex items-center gap-3">
                              <span className="bg-blue-600 text-white p-1 rounded-md"><Trophy className="w-3 h-3" /></span>
                              <span className="font-bold text-blue-900">{e.jogadorNome}</span>
                           </div>
                           <button onClick={() => {
                             setGameEvents(prev => prev.filter((_, i) => i !== idx));
                             if (e.timeId === selectedGame.time_casa) setHomeGoals(prev => Math.max(0, prev - 1));
                             else setAwayGoals(prev => Math.max(0, prev - 1));
                           }} className="text-red-400 hover:text-red-600 transition"><X className="w-4 h-4" /></button>
                        </div>
                      ))}
                   </div>
                </div>
             </div>
             <div className="p-8 bg-gray-50 border-t border-gray-100">
                <button 
                  onClick={async () => {
                     try {
                        await api.post(`/campeonatos/${id}/jogos/${selectedGame.id}/registrar`, {
                           gols_casa: homeGoals,
                           gols_visitante: awayGoals,
                           eventos: gameEvents
                        });
                        toast.success("Resultado finalizado!");
                        setShowResultModal(false);
                        fetchChamp();
                        fetchStandings();
                        fetchScorers();
                     } catch (e) {
                        toast.error("Erro ao salvar resultado.");
                     }
                  }}
                  className="w-full bg-green-600 text-white py-5 rounded-3xl font-black text-xl shadow-xl hover:bg-green-700 hover:scale-[1.02] active:scale-95 transition"
                >
                   SALVAR RESULTADO
                </button>
             </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChampionshipDetail;
