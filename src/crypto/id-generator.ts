import { customAlphabet } from 'nanoid';

/**
 * Centralized ID Generator
 * Provides consistent ID generation across all entities
 */
export class IDGenerator {
  private static readonly nanoid = customAlphabet(
    '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz',
    21
  );

  /**
   * Generate a unique ID using base62 alphabet (21 characters)
   * Safe for URLs and databases
   */
  static generate(): string {
    return this.nanoid();
  }

  /**
   * Generate a unique ID with custom length
   */
  static generateWithLength(length: number): string {
    const customNanoid = customAlphabet(
      '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz',
      length
    );
    return customNanoid();
  }

  /**
   * Generate a unique ID with custom alphabet
   */
  static generateWithAlphabet(alphabet: string, length: number = 21): string {
    const customNanoid = customAlphabet(alphabet, length);
    return customNanoid();
  }
}
