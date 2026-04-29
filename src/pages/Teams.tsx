import React, { useState, useEffect } from "react";
import api from "../services/api";
import { toast } from "react-hot-toast";
import { Users, Plus, Pencil, Trash2, Loader2, MapPin } from "lucide-react";

interface Team {
  id: string;
  name: string;
  city: string;
}

const Teams = () => {
  const [teams, setTeams] = useState<Team[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingTeam, setEditingTeam] = useState<Team | null>(null);
  const [formData, setFormData] = useState({ name: "", city: "" });

  useEffect(() => {
    fetchTeams();
  }, []);

  const fetchTeams = async () => {
    try {
      const response = await api.get("/times");
      setTeams(response.data);
    } catch (error) {
      toast.error("Erro ao carregar times.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      if (editingTeam) {
        await api.put(`/times/${editingTeam.id}`, formData);
        toast.success("Time atualizado!");
      } else {
        await api.post("/times", formData);
        toast.success("Time criado!");
      }
      setShowModal(false);
      setFormData({ name: "", city: "" });
      setEditingTeam(null);
      fetchTeams();
    } catch (error) {
      toast.error("Erro ao salvar time.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Tem certeza que deseja excluir este time?")) return;
    try {
      await api.delete(`/times/${id}`);
      toast.success("Time excluído!");
      fetchTeams();
    } catch (error) {
      toast.error("Erro ao excluir time.");
    }
  };

  const openModal = (team?: Team) => {
    if (team) {
      setEditingTeam(team);
      setFormData({ name: team.name, city: team.city });
    } else {
      setEditingTeam(null);
      setFormData({ name: "", city: "" });
    }
    setShowModal(true);
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center">
          <Users className="mr-2 h-6 w-6 text-blue-600" />
          Gestão de Times
        </h1>
        <button
          onClick={() => openModal()}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center hover:bg-blue-700 transition-colors"
        >
          <Plus className="mr-2 h-5 w-5" />
          Novo Time
        </button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="animate-spin h-8 w-8 text-blue-600" />
        </div>
      ) : teams.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl border border-dashed border-gray-300">
          <Users className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <p className="text-gray-500">Nenhum time cadastrado ainda.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {teams.map((team) => (
            <div key={team.id} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-bold text-gray-900">{team.name}</h3>
                  <p className="text-sm text-gray-500 flex items-center mt-1">
                    <MapPin className="h-4 w-4 mr-1" />
                    {team.city}
                  </p>
                </div>
                <div className="flex space-x-2">
                  <button onClick={() => openModal(team)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg">
                    <Pencil className="h-5 w-5" />
                  </button>
                  <button onClick={() => handleDelete(team.id)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg">
                    <Trash2 className="h-5 w-5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full">
            <h2 className="text-xl font-bold mb-4">{editingTeam ? "Editar Time" : "Novo Time"}</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nome do Time</label>
                <input
                  type="text"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Cidade</label>
                <input
                  type="text"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                />
              </div>
              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center"
                >
                  {isSubmitting && <Loader2 className="animate-spin h-4 w-4 mr-2" />}
                  Salvar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Teams;
