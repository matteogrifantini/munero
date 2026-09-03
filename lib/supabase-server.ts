import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
export function supabaseServer() {
  const store = cookies();
  return createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    cookies: {
      get(n: string) { return store.get(n)?.value; },
      set(n: string, v: string, o: object) { try { store.set(n, v, o as Parameters<typeof store.set>[2]); } catch {} },
      remove(n: string, o: object) { try { store.set(n, '', { ...(o as object), maxAge: 0 } as Parameters<typeof store.set>[2]); } catch {} },
    },
  });
}
