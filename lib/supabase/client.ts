"use client";

import { createBrowserClient } from "@supabase/ssr";

// Singleton: garante uma única instância e usa cookies (compatível com o middleware)
let client: ReturnType<typeof createBrowserClient> | undefined;

export function getSupabaseClient() {
  if (!client) {
    client = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
  }
  return client;
}