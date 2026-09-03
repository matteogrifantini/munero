import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
export function supabaseServer() {
  const store = cookies();
  return createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    cookies: { get(n: string) { return store.get(n)?.value; } },
  });
}
