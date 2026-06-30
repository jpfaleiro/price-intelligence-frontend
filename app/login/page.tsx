"use client";

import { getSupabaseClient } from "@/lib/supabase/client";

const supabase = getSupabaseClient();

export default function LoginPage() {
  const handleGoogleLogin = async () => {
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `http://localhost:3000/auth/callback`,
      },
    });
  };

  return (
    <div className="min-h-screen bg-[#0f172a] flex items-center justify-center">
      <div className="bg-[#1e293b] border border-slate-800 rounded-2xl p-10 flex flex-col items-center gap-6 shadow-2xl w-full max-w-sm">
        <div className="flex flex-col items-center gap-2">
          <span className="text-2xl font-black tracking-wider text-white uppercase">PRICE-INTEL</span>
          <span className="text-xs text-slate-500 font-medium">Market Intelligence Panel</span>
        </div>
        <div className="w-full h-px bg-slate-800" />
        <p className="text-sm text-slate-400 text-center">Faça login para acessar o dashboard</p>
        <button
          onClick={handleGoogleLogin}
          className="w-full flex items-center justify-center gap-3 bg-white hover:bg-gray-100 text-gray-800 font-bold py-3 px-6 rounded-xl transition-all shadow-md"
        >
          <svg width="20" height="20" viewBox="0 0 48 48">
            <path fill="#FFC107" d="M43.6 20H24v8h11.3C33.6 33.1 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.1 7.9 3l5.7-5.7C34.1 6.5 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20c11 0 20-8 20-20 0-1.3-.1-2.7-.4-4z"/>
            <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.5 16 19 13 24 13c3.1 0 5.8 1.1 7.9 3l5.7-5.7C34.1 6.5 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/>
            <path fill="#4CAF50" d="M24 44c5.2 0 9.9-1.9 13.5-5l-6.2-5.2C29.4 35.6 26.8 36 24 36c-5.2 0-9.6-2.9-11.3-7l-6.5 5C9.6 39.6 16.3 44 24 44z"/>
            <path fill="#1976D2" d="M43.6 20H24v8h11.3c-.8 2.3-2.3 4.2-4.3 5.5l6.2 5.2C41 35.2 44 30 44 24c0-1.3-.1-2.7-.4-4z"/>
          </svg>
          Entrar com Google
        </button>
        <p className="text-[10px] text-slate-600 text-center">Acesso restrito · Price-Intel © 2026</p>
      </div>
    </div>
  );
}