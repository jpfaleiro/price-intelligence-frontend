"use client";

import { useEffect, useState } from "react";
import { getSupabaseClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import type { Session } from "@supabase/supabase-js";

const supabase = getSupabaseClient();

export default function AuthCallback() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        // Aguarda a sessão ser estabelecida
        const { data: { session } } = await supabase.auth.getSession();

        if (session?.user) {
          // Verifica se o perfil já existe
          const { data: profile } = await supabase
            .from("profiles")
            .select("id")
            .eq("id", session.user.id)
            .single();

          if (profile) {
            // Perfil existe, vai pro dashboard
            router.push("/");
          } else {
            // Perfil não existe, vai pro setup
            router.push("/profile-setup");
          }
        } else {
          // Sem sessão, volta pro login
          router.push("/auth/login");
        }
      } catch (error) {
        console.error("Erro no auth callback:", error);
        router.push("/auth/login");
      } finally {
        setLoading(false);
      }
    };

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event: string, session: Session | null) => {
        if (session) {
          handleAuthCallback();
        } else {
          router.push("/auth/login");
          setLoading(false);
        }
      }
    );

    // Chama uma vez na montagem
    handleAuthCallback();

    return () => {
      subscription?.unsubscribe();
    };
  }, [router]);

  return (
    <div className="min-h-screen bg-[#0f172a] flex items-center justify-center">
      <div className="text-center">
        <div className="mb-4 flex justify-center">
          <div className="relative w-12 h-12">
            <div className="absolute inset-0 bg-blue-600 rounded-full animate-pulse" />
            <div className="absolute inset-1 bg-[#0f172a] rounded-full" />
          </div>
        </div>
        <p className="text-slate-400">Autenticando...</p>
      </div>
    </div>
  );
}