import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
const cache = new Map<string, { status: string; at: number }>();
export default async function proxy(req: NextRequest) {
  const m = req.nextUrl.pathname.match(/^\/t\/([a-z0-9-]+)/);
  if (!m) return NextResponse.next();
  const slug = m[1];
  const hit = cache.get(slug);
  let status = hit && Date.now() - hit.at < 30_000 ? hit.status : null;
  if (!status) {
    try {
      const r = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/tenants?slug=eq.${slug}&select=status`, {
        headers: { apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, Authorization: `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!}` },
      });
      if (!r.ok) return NextResponse.rewrite(new URL('/sospeso', req.url));
      const rows = (await r.json()) as { status: string }[];
      if (!rows.length) return NextResponse.rewrite(new URL('/sospeso', req.url));
      status = rows[0].status;
      cache.set(slug, { status, at: Date.now() });
    } catch {
      return NextResponse.rewrite(new URL('/sospeso', req.url));
    }
  }
  // Fail-closed: only active/past_due_grace render; suspended/deleted/unknown -> /sospeso.
  if (status !== 'active' && status !== 'past_due_grace') return NextResponse.rewrite(new URL('/sospeso', req.url));
  return NextResponse.next();
}
export const config = { matcher: ['/t/:slug*'] };
