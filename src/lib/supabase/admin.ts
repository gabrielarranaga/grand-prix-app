import { createClient as createSupabaseClient } from "@supabase/supabase-js";

// Cliente con la service role key: ignora RLS por completo.
// Solo se debe usar en codigo de servidor (server actions / route handlers)
// despues de verificar explicitamente que quien llama es admin.
// NUNCA importar este archivo desde un Client Component.
export function createAdminClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  );
}
