import { describe, it, expect } from 'vitest';
import { DEFAULT_HEADER_SIZE, HEADER_SIZES, headerSizeLabel, parseHeaderSize } from '@/services/paperback/headerSize';

describe('headerSize', () => {
  it('accepts the known sizes and falls back for anything else', () => {
    for (const s of HEADER_SIZES) expect(parseHeaderSize(s.id)).toBe(s.id);
    expect(parseHeaderSize(null)).toBe(DEFAULT_HEADER_SIZE);
    expect(parseHeaderSize('huge')).toBe(DEFAULT_HEADER_SIZE);
    expect(parseHeaderSize(2)).toBe(DEFAULT_HEADER_SIZE);
  });

  it('regular is the default and every size has a label', () => {
    expect(DEFAULT_HEADER_SIZE).toBe('regular');
    expect(headerSizeLabel('compact')).toBe('Compact');
    expect(headerSizeLabel('large')).toBe('Large');
  });
});
