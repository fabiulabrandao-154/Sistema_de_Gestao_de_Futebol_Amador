import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import { toast } from "react-hot-toast";
import { Trophy, Plus, Loader2, Calendar, Settings } from "lucide-react";

interface Championship {
  id: string;
  nome: string;
  formato: string;
  data_inicio: string;
  status: string;
}

const Championships = () => {
  const navigate = useNavigate();
  const [championships, setChampionships] = useState<Championship[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showModal, setShowModal] = useState(false);
  
  const [formData, setFormData] = useState({ 
    nome: "", 
    formato: "pontos_corridos",
    data_inicio: new Date().toISOString().split('T')[0],
    data_fim: new Date().toISOString().split('T')[0]
  });

  useEffect(() => {
    fetchChampionships();
  }, []);

  const fetchChampionships = async () => {
    try {
      const response = await api.get("/campeonatos/");
      const data = Array.isArray(response.data) ? response.data : [];
      setChampionships(data);
    } catch (error) {
      toast.error("Erro ao carregar campeonatos.");
      setChampionships([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await api.post("/campeonatos/", formData);
      toast.success("Campeonato criado!");
      setShowModal(false);
      setFormData({ 
        nome: "", 
        formato: "pontos_corridos",
        data_inicio: new Date().toISOString().split('T')[0],
        data_fim: new Date().toISOString().split('T')[0]
      });
      fetchChampionships();
    } catch (error) {
      toast.error("Erro ao criar campeonato.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center">
            <Trophy className="mr-2 h-6 w-6 text-yellow-500" />
            Campeonatos
          </h1>
          <p className="text-gray-600">Organize torneios e ligas para seus jogadores.</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center hover:bg-blue-700 transition"
        >
          <Plus className="mr-2 h-5 w-5" />
          Novo Campeonato
        </button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="animate-spin h-8 w-8 text-blue-600" />
        </div>
      ) : championships.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-gray-200">
          <Trophy className="mx-auto h-16 w-16 text-gray-200 mb-4" />
          <p className="text-gray-500 font-medium">Nenhum campeonato cadastrado ainda.</p>
          <button 
            onClick={() => setShowModal(true)}
            className="mt-4 text-blue-600 font-bold hover:underline"
          >
            Começar primeiro campeonato
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {championships.map((champ) => (
            <div 
              key={champ.id} 
              onClick={() => navigate(`/championships/${champ.id}`)}
              className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition cursor-pointer group"
            >
              <div className="flex items-center mb-4">
                <div className="bg-yellow-50 p-4 rounded-2xl mr-4 group-hover:scale-110 transition">
                  <Trophy className="h-6 w-6 text-yellow-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg font-bold text-gray-900 truncate">{champ.nome}</h3>
                  <div className="flex items-center mt-1">
                     <span className={`w-2 h-2 rounded-full mr-2 ${champ.status === 'ativo' ? 'bg-green-500' : 'bg-gray-300'}`}></span>
                     <span className="text-xs text-gray-500 uppercase font-bold tracking-wider">{champ.status}</span>
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-50 text-xs">
                 <div className="text-gray-500">
                    <div className="flex items-center mb-1">
                       <Calendar className="w-3 h-3 mr-1" /> Início
                    </div>
                    <div className="font-bold text-gray-700">{new Date(champ.data_inicio).toLocaleDateString()}</div>
                 </div>
                 <div className="text-gray-500">
                    <div className="flex items-center mb-1">
                       <Settings className="w-3 h-3 mr-1" /> Formato
                    </div>
                    <div className="font-bold text-gray-700 capitalize">{champ.formato.replace('_', ' ')}</div>
                 </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl">
            <h2 className="text-2xl font-black mb-6">Criar Campeonato</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Nome do Campeonato</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Copa do Mundo 2024"
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                  value={formData.nome}
                  onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                />
              </div>
              
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Formato</label>
                <select 
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                  value={formData.formato}
                  onChange={(e) => setFormData({ ...formData, formato: e.target.value })}
                >
                   <option value="pontos_corridos">Pontos Corridos</option>
                   <option value="grupos_mata">Grupos + Mata-Mata</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Data Início</label>
                  <input
                    type="date"
                    required
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                    value={formData.data_inicio}
                    onChange={(e) => setFormData({ ...formData, data_inicio: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Data Fim</label>
                  <input
                    type="date"
                    required
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                    value={formData.data_fim}
                    onChange={(e) => setFormData({ ...formData, data_fim: e.target.value })}
                  />
                </div>
              </div>

              <div className="flex gap-4 pt-6">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-6 py-3 text-gray-600 font-bold hover:bg-gray-100 rounded-xl transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 bg-blue-600 text-white px-6 py-3 rounded-xl hover:bg-blue-700 disabled:opacity-50 font-bold flex items-center justify-center transition shadow-lg shadow-blue-200"
                >
                  {isSubmitting ? <Loader2 className="animate-spin h-5 w-5" /> : "Criar Agora"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Championships;
