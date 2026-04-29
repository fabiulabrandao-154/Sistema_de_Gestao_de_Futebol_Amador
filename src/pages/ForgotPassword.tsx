import React, { useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "react-hot-toast";
import { Mail, ArrowLeft, Loader2, CheckCircle2 } from "lucide-react";
import api from "../services/api";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSent, setIsSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Simulate API call for password recovery
      await api.post("/auth/recover-password", { email });
      setIsSent(true);
      toast.success("Instruções enviadas para o seu e-mail!");
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Erro ao processar solicitação.");
    } finally {
      setIsLoading(false);
    }
  };

  if (isSent) {
    return (
      <div 
        className="min-h-screen flex items-center justify-center p-4 bg-cover bg-center bg-no-repeat relative font-sans"
        style={{ 
          backgroundImage: `url('https://images.unsplash.com/photo-1574629810360-7efbbe195018?q=80&w=2000&auto=format&fit=crop')` 
        }}
      >
        <div className="absolute inset-0 bg-black/50 backdrop-blur-[2px]"></div>

        <div className="max-w-md w-full space-y-8 bg-white/90 backdrop-blur-md p-8 rounded-3xl shadow-2xl border border-white/20 relative z-10 text-center">
          <div className="flex justify-center">
            <div className="bg-green-100 p-3 rounded-full shadow-inner">
              <CheckCircle2 className="h-12 w-12 text-green-600" />
            </div>
          </div>
          <h2 className="text-2xl font-black text-gray-900">Verifique seu E-mail</h2>
          <p className="text-gray-600 font-medium leading-relaxed">
            Enviamos um link de recuperação para <strong>{email}</strong>. 
            Siga as instruções para redefinir sua senha.
          </p>
          <div className="pt-4 border-t border-gray-100">
            <Link
              to="/login"
              className="inline-flex items-center text-sm font-bold text-blue-600 hover:text-blue-500 transition-colors"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Voltar para o Login
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div 
      className="min-h-screen flex items-center justify-center p-4 bg-cover bg-center bg-no-repeat relative font-sans"
      style={{ 
        backgroundImage: `url('https://images.unsplash.com/photo-1574629810360-7efbbe195018?q=80&w=2000&auto=format&fit=crop')` 
      }}
    >
      <div className="absolute inset-0 bg-black/50 backdrop-blur-[2px]"></div>

      <div className="max-w-md w-full space-y-8 bg-white/90 backdrop-blur-md p-8 rounded-3xl shadow-2xl border border-white/20 relative z-10">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-2xl mb-4 shadow-lg shadow-blue-500/30">
            <Mail className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight">FutGestão</h1>
          <h2 className="mt-2 text-xl font-bold text-gray-900">Recuperar Senha</h2>
          <p className="mt-2 text-sm text-gray-600 font-medium">
            Informe seu e-mail e enviaremos as instruções para você.
          </p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Mail className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="email"
                required
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-sm"
                placeholder="seu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 transition-colors"
          >
            {isLoading ? (
              <Loader2 className="animate-spin h-5 w-5" />
            ) : (
              "Enviar Instruções"
            )}
          </button>

          <div className="text-center">
            <Link
              to="/login"
              className="inline-flex items-center text-sm font-medium text-blue-600 hover:text-blue-500"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Voltar para o Login
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ForgotPassword;
