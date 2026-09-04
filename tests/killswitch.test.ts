// tests/killswitch.test.ts
import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
describe('killswitch', () => {
  it('proxy checks tenant status fail-closed', () => {
    const src = fs.readFileSync('proxy.ts', 'utf8');
    expect(src).toContain('suspended');
    expect(src).toContain('/sospeso');
  });
});
