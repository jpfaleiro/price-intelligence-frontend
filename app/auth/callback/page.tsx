"use client";

import { useEffect } from "react";
import { getSupabaseClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import type { Session } from '@supabase/supabase-js';

const supabase = getSupabaseClient();

export default function AuthCallback() {
  const router = useRouter();

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event: string, session: Session | null) => {
        if (session) {
          router.push("/");
        }
      }
    );

    return () => {
      subscription?.unsubscribe();
    };
  }, [router]);

  return (
    <div className="min-h-screen bg-[#0f172a] flex items-center justify-center">
      <div className="text-white text-sm">Autenticando...</div>
    </div>
  );
}