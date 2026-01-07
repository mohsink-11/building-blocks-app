import { describe, it, expect, beforeEach } from 'vitest';
import { readTemplatesFromStorage, seedTemplates } from '@/lib/templates';

describe('templates storage', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('returns seed templates when nothing in storage', () => {
    const got = readTemplatesFromStorage();
    expect(got).toBeDefined();
    expect(Array.isArray(got)).toBe(true);
    expect(got.length).toBeGreaterThan(0);
    expect(got[0].id).toBe(seedTemplates[0].id);
  });

  it('parses stored templates', () => {
    const custom = [{ id: 'x1', name: 'Custom' }];
    localStorage.setItem('templates_v1', JSON.stringify(custom));
    const got = readTemplatesFromStorage();
    expect(got).toEqual(custom);
  });
});