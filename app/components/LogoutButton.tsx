"use client";

import { getSupabaseClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

const supabase = getSupabaseClient();

export default function LogoutButton() {
  const router = useRouter();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  };

  return (
    <button
      onClick={handleLogout}
      className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium py-2 px-4 rounded-lg transition-all border border-slate-700"
    >
      Sair
    </button>
  );
}