"use client";

import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import Dashboard from "../Dashboard";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function Page() {
  const [status, setStatus] = useState<"loading" | "ok" | "noauth">("loading");
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setUser(session.user);
        setStatus("ok");
      } else {
        setStatus("noauth");
      }
    });
  }, []);

  useEffect(() => {
    if (status === "noauth") {
      window.location.href = "/login";
    }
  }, [status]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = "/login";
  };

  if (status === "loading" || status === "noauth") {
    return (
      <div className="min-h-screen bg-[#0f172a] flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return <Dashboard user={user} onLogout={handleLogout} />;
}