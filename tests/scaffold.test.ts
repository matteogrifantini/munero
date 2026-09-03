import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
describe('scaffold', () => {
  it('has vercel-ready next config and supabase helpers', () => {
    expect(fs.existsSync('next.config.mjs')).toBe(true);
    expect(fs.existsSync('lib/supabase-server.ts')).toBe(true);
    expect(fs.existsSync('lib/supabase-client.ts')).toBe(true);
    expect(fs.existsSync('.env.example')).toBe(true);
  });
});
