import { describe, it, expect } from 'vitest';
import { IDGenerator } from '../id-generator';

const BASE62 = /^[0-9A-Za-z]+$/;
const UUID_V7 = /^[0-9a-f]{8}-[0-9a-f]{4}-7[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

describe('IDGenerator', () => {
  describe('generate() - default NanoID', () => {
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

  describe('generate("uuid") - UUID v7', () => {
    it('returns a valid UUID v7 format', () => {
      const id = IDGenerator.generate('uuid');
      expect(id).toMatch(UUID_V7);
    });

    it('produces unique UUIDs across many calls', () => {
      const ids = new Set(Array.from({ length: 1000 }, () => IDGenerator.generate('uuid')));
      expect(ids.size).toBe(1000);
    });

    it('generates time-ordered UUIDs', () => {
      const id1 = IDGenerator.generate('uuid');
      const id2 = IDGenerator.generate('uuid');
      // UUID v7 timestamps should be ordered
      expect(id1 < id2).toBe(true);
    });
  });

  describe('generate({ format: "uuid" })', () => {
    it('returns a valid UUID v7 format', () => {
      const id = IDGenerator.generate({ format: 'uuid' });
      expect(id).toMatch(UUID_V7);
    });
  });

  describe('generate({ length })', () => {
    it('returns a string of the requested length', () => {
      expect(IDGenerator.generate({ length: 8 })).toHaveLength(8);
      expect(IDGenerator.generate({ length: 32 })).toHaveLength(32);
      expect(IDGenerator.generate({ length: 1 })).toHaveLength(1);
    });

    it('uses only base62 characters regardless of length', () => {
      expect(IDGenerator.generate({ length: 64 })).toMatch(BASE62);
    });

    it('produces unique IDs for the same length', () => {
      const ids = new Set(Array.from({ length: 200 }, () => IDGenerator.generate({ length: 10 })));
      expect(ids.size).toBe(200);
    });
  });

  describe('generate({ alphabet })', () => {
    it('returns a 21-character string when no length is given', () => {
      expect(IDGenerator.generate({ alphabet: 'abc' })).toHaveLength(21);
    });

    it('honours the custom length parameter', () => {
      expect(IDGenerator.generate({ alphabet: 'abc', length: 10 })).toHaveLength(10);
    });

    it('only uses characters from the provided alphabet', () => {
      for (let i = 0; i < 50; i++) {
        const id = IDGenerator.generate({ alphabet: 'abc', length: 20 });
        expect(id).toMatch(/^[abc]+$/);
      }
    });

    it('works with a single-character alphabet', () => {
      const id = IDGenerator.generate({ alphabet: 'X', length: 5 });
      expect(id).toBe('XXXXX');
    });
  });
});
