"use client";

import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  { auth: { flowType: "implicit" } }
);

export default function AuthCallback() {
  const [msg, setMsg] = useState("Processando login...");

  useEffect(() => {
    // No fluxo implícito, o token vem no hash da URL
    const hash = window.location.hash;
    setMsg(`Hash: ${hash ? "encontrado" : "vazio"}`);

    supabase.auth.onAuthStateChange((event, session) => {
      setMsg(`Evento: ${event}`);
      if (event === "SIGNED_IN" && session) {
        setMsg("Login OK! Redirecionando...");
        setTimeout(() => {
          window.location.replace("/");
        }, 500);
      }
    });

    // Verifica sessão existente
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setMsg("Sessão encontrada! Redirecionando...");
        setTimeout(() => {
          window.location.replace("/");
        }, 500);
      }
    });
  }, []);

  return (
    <div className="min-h-screen bg-[#0f172a] flex items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <div className="w-6 h-6 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
        <div className="text-white text-sm text-center px-4">{msg}</div>
      </div>
    </div>
  );
}