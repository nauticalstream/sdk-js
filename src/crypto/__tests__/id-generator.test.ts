import { describe, it, expect } from 'vitest';
import { IDGenerator } from '../id-generator';

const BASE62 = /^[0-9A-Za-z]+$/;

describe('IDGenerator', () => {
  describe('generate()', () => {
    it('returns a 21-character string by default', () => {
      expect(IDGenerator.generate()).toHaveLength(21);
    });

    it('uses only base62 characters (0-9, A-Z, a-z)', () => {
      for (let i = 0; i < 50; i++) {
        expect(IDGenerator.generate()).toMatch(BASE62);
      }
    });

    it('produces unique IDs across many calls', () => {
      const ids = new Set(Array.from({ length: 1000 }, () => IDGenerator.generate()));
      expect(ids.size).toBe(1000);
    });
  });

  describe('generateWithLength()', () => {
    it('returns a string of the requested length', () => {
      expect(IDGenerator.generateWithLength(8)).toHaveLength(8);
      expect(IDGenerator.generateWithLength(32)).toHaveLength(32);
      expect(IDGenerator.generateWithLength(1)).toHaveLength(1);
    });

    it('uses only base62 characters regardless of length', () => {
      expect(IDGenerator.generateWithLength(64)).toMatch(BASE62);
    });

    it('produces unique IDs for the same length', () => {
      const ids = new Set(Array.from({ length: 200 }, () => IDGenerator.generateWithLength(10)));
      expect(ids.size).toBe(200);
    });
  });

  describe('generateWithAlphabet()', () => {
    it('returns a 21-character string when no length is given', () => {
      expect(IDGenerator.generateWithAlphabet('abc')).toHaveLength(21);
    });

    it('honours the custom length parameter', () => {
      expect(IDGenerator.generateWithAlphabet('abc', 10)).toHaveLength(10);
    });

    it('only uses characters from the provided alphabet', () => {
      for (let i = 0; i < 50; i++) {
        const id = IDGenerator.generateWithAlphabet('abc', 20);
        expect(id).toMatch(/^[abc]+$/);
      }
    });

    it('works with a single-character alphabet', () => {
      const id = IDGenerator.generateWithAlphabet('X', 5);
      expect(id).toBe('XXXXX');
    });
  });
});
