"use client";

import { useState } from "react";
import { getSupabaseClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

const supabase = getSupabaseClient();

interface UserProfile {
  name: string;
  age: number;
  purpose: string;
  theme: "light" | "dark";
  notifications: boolean;
}

export default function ProfileSetup() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<UserProfile>({
    name: "",
    age: 0,
    purpose: "personal",
    theme: "dark",
    notifications: true,
  });

  const purposeOptions = [
    { value: "personal", label: "Uso Pessoal" },
    { value: "business", label: "Negócio/Empresa" },
    { value: "research", label: "Pesquisa" },
    { value: "education", label: "Educação" },
    { value: "other", label: "Outro" },
  ];

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "number" ? parseInt(value) : value,
    }));
  };

  const handleToggle = (field: "theme" | "notifications") => {
    if (field === "theme") {
      setFormData((prev) => ({
        ...prev,
        theme: prev.theme === "dark" ? "light" : "dark",
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        notifications: !prev.notifications,
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim() || formData.age <= 0) {
      alert("Por favor, preencha todos os campos");
      return;
    }

    setLoading(true);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        throw new Error("Usuário não autenticado");
      }

      // Salva o perfil na tabela profiles
      const { error } = await supabase
        .from("profiles")
        .upsert({
          id: user.id,
          email: user.email,
          name: formData.name,
          age: formData.age,
          purpose: formData.purpose,
          theme: formData.theme,
          notifications: formData.notifications,
          updated_at: new Date(),
        });

      if (error) throw error;

      // Salva preferências no localStorage também
      localStorage.setItem("userPreferences", JSON.stringify(formData));
      
      // Aplica o tema
      applyTheme(formData.theme);

      router.push("/");
    } catch (error) {
      console.error("Erro ao salvar perfil:", error);
      alert("Erro ao salvar perfil. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  const applyTheme = (theme: "light" | "dark") => {
    const html = document.documentElement;
    if (theme === "dark") {
      html.classList.add("dark");
    } else {
      html.classList.remove("dark");
    }
  };

  const avatarBg = formData.name
    ? `hsl(${formData.name.charCodeAt(0) * 12}, 70%, 50%)`
    : "#6b7280";

  return (
    <div className="min-h-screen bg-[#0f172a] flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-[#1e293b] border border-slate-800 rounded-2xl p-8 shadow-2xl">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-black tracking-wider text-white uppercase mb-2">
            PRICE-INTEL
          </h1>
          <p className="text-xs text-slate-500 font-medium">Finalize seu perfil</p>
        </div>

        {/* Avatar Preview */}
        <div className="flex justify-center mb-8">
          <div
            className="w-20 h-20 rounded-full flex items-center justify-center text-3xl font-bold text-white shadow-lg"
            style={{ backgroundColor: avatarBg }}
          >
            {formData.name ? formData.name.charAt(0).toUpperCase() : "?"}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Nome */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Nome Completo
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="Seu nome"
              className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
              required
            />
          </div>

          {/* Idade */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Idade
            </label>
            <input
              type="number"
              name="age"
              value={formData.age || ""}
              onChange={handleChange}
              placeholder="Sua idade"
              min="13"
              max="120"
              className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
              required
            />
          </div>

          {/* Finalidade */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Qual é sua finalidade?
            </label>
            <select
              name="purpose"
              value={formData.purpose}
              onChange={handleChange}
              className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all cursor-pointer"
            >
              {purposeOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          {/* Tema */}
          <div className="flex items-center justify-between p-3 bg-slate-900 rounded-lg border border-slate-700">
            <div className="flex items-center gap-3">
              <svg
                className="w-5 h-5 text-slate-400"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
              </svg>
              <span className="text-sm text-slate-300">
                Tema: <span className="font-semibold text-white">
                  {formData.theme === "dark" ? "Escuro" : "Claro"}
                </span>
              </span>
            </div>
            <button
              type="button"
              onClick={() => handleToggle("theme")}
              className="relative w-12 h-6 bg-blue-600 rounded-full transition-all hover:bg-blue-700"
            >
              <div
                className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${
                  formData.theme === "light" ? "translate-x-6" : ""
                }`}
              />
            </button>
          </div>

          {/* Notificações */}
          <div className="flex items-center justify-between p-3 bg-slate-900 rounded-lg border border-slate-700">
            <div className="flex items-center gap-3">
              <svg
                className="w-5 h-5 text-slate-400"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5.951-1.429 5.951 1.429a1 1 0 001.169-1.409l-7-14z" />
              </svg>
              <span className="text-sm text-slate-300">
                Notificações: <span className="font-semibold text-white">
                  {formData.notifications ? "Ativadas" : "Desativadas"}
                </span>
              </span>
            </div>
            <button
              type="button"
              onClick={() => handleToggle("notifications")}
              className="relative w-12 h-6 rounded-full transition-all"
              style={{
                backgroundColor: formData.notifications ? "#3b82f6" : "#475569",
              }}
            >
              <div
                className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${
                  formData.notifications ? "translate-x-6" : ""
                }`}
              />
            </button>
          </div>

          {/* Divider */}
          <div className="h-px bg-slate-800" />

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-slate-600 text-white font-bold py-3 px-6 rounded-lg transition-all shadow-lg disabled:cursor-not-allowed"
          >
            {loading ? "Salvando..." : "Continuar para Dashboard"}
          </button>

          <p className="text-[10px] text-slate-600 text-center">
            Seus dados estão seguros e criptografados
          </p>
        </form>
      </div>
    </div>
  );
}