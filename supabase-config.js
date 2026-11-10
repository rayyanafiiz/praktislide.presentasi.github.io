// Isi dua nilai ini dari Supabase Dashboard > Project Settings > API.
// Gunakan Project URL dan anon/public key. JANGAN gunakan service_role key.
(() => {
  const SUPABASE_URL = "https://jkgwdykotfnrpsixhudn.supabase.co";
  const SUPABASE_ANON_KEY = "sb_publishable_D9enIqiiXOT8BlaafjKl-A_ELQFlKs-";

  if (
    window.supabase &&
    SUPABASE_URL.startsWith("https://") &&
    SUPABASE_ANON_KEY &&
    !SUPABASE_URL.includes("ISI_") &&
    !SUPABASE_ANON_KEY.includes("ISI_")
  ) {
    window.praktislideSupabase = window.supabase.createClient(
      SUPABASE_URL,
      SUPABASE_ANON_KEY
    );
  }
})();
