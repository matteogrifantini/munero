import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
export async function supabaseServer() {
  const store = await cookies();
  return createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    cookies: {
      getAll() { return store.getAll(); },
      setAll(toSet: { name: string; value: string; options?: object }[]) {
        try { toSet.forEach(({ name, value, options }) => store.set(name, value, options)); } catch {}
      },
    },
  });
}
