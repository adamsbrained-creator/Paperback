import { describe, it, expect } from 'vitest';
import { DEFAULT_NAV_STYLE, NAV_STYLES, parseNavStyle } from '@/services/paperback/navStyle';

describe('navStyle', () => {
  it('accepts the known styles and falls back for anything else', () => {
    for (const s of NAV_STYLES) expect(parseNavStyle(s.id)).toBe(s.id);
    expect(parseNavStyle(null)).toBe(DEFAULT_NAV_STYLE);
    expect(parseNavStyle('swipe')).toBe(DEFAULT_NAV_STYLE);
    expect(parseNavStyle(3)).toBe(DEFAULT_NAV_STYLE);
  });
});
