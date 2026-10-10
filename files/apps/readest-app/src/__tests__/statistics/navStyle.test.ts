import { describe, it, expect } from 'vitest';
import { DEFAULT_HOME_STYLE, DEFAULT_NAV_STYLE, HOME_STYLES, NAV_STYLES, parseHomeStyle, parseNavStyle } from '@/services/paperback/navStyle';

describe('navStyle', () => {
  it('accepts the known styles and falls back for anything else', () => {
    for (const s of NAV_STYLES) expect(parseNavStyle(s.id)).toBe(s.id);
    expect(parseNavStyle(null)).toBe(DEFAULT_NAV_STYLE);
    expect(parseNavStyle('swipe')).toBe(DEFAULT_NAV_STYLE);
    expect(parseNavStyle(3)).toBe(DEFAULT_NAV_STYLE);
  });

  it('home layout: known ids or the default', () => {
    for (const s of HOME_STYLES) expect(parseHomeStyle(s.id)).toBe(s.id);
    expect(parseHomeStyle('bento')).toBe(DEFAULT_HOME_STYLE);
    expect(parseHomeStyle(undefined)).toBe(DEFAULT_HOME_STYLE);
  });
});
