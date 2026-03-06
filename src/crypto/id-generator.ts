import { customAlphabet } from 'nanoid';
import { v7 as uuidv7 } from 'uuid';

const BASE62 = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';

type IDFormat = 'nanoid' | 'uuid';

interface GenerateOptions {
  /** ID format type. Default: 'nanoid' */
  format?: IDFormat;
  /** Length for NanoID (ignored for UUID). Default: 21 */
  length?: number;
  /** Custom alphabet for NanoID (ignored for UUID). Default: BASE62 */
  alphabet?: string;
}

/**
 * Centralized ID Generator
 *
 * Supports two ID formats:
 * 1. NanoID (CSPRNG) with base62 alphabet (0-9A-Za-z) - default for entity IDs
 * 2. UUID v7 (time-ordered) - for event IDs and distributed ordering
 *
 * NanoID:
 * - Entropy: 21 chars × log₂(62) ≈ 125 bits — slightly more than UUID v4 (122 bits)
 * - Collision probability reaches ~1% only after ~2.3 × 10¹⁸ generated IDs
 * - URL-safe and database-safe
 *
 * UUID v7:
 * - Time-ordered (sortable by creation time)
 * - 128-bit unique identifier
 * - Better for event deduplication and distributed systems
 * - Standard format: 8-4-4-4-12 hex characters
 *
 * @example
 * // Default NanoID
 * IDGenerator.generate() // => "A1B2C3D4E5F6G7H8I9J0K"
 *
 * // UUID v7
 * IDGenerator.generate('uuid') // => "018e8c4e-9c7a-7890-1234-56789abcdef0"
 * IDGenerator.generate({ format: 'uuid' }) // => "018e8c4e-9c7a-7890-1234-56789abcdef0"
 *
 * // Custom length NanoID
 * IDGenerator.generate({ length: 10 }) // => "A1B2C3D4E5"
 *
 * // Custom alphabet
 * IDGenerator.generate({ alphabet: '0123456789', length: 10 }) // => "1234567890"
 */
export class IDGenerator {
  private static readonly nanoid = customAlphabet(BASE62, 21);

  /** Cache generators keyed by `${alphabet}:${length}` to avoid re-running setup on every call. */
  private static readonly cache = new Map<string, () => string>();

  /**
   * Generate a unique ID.
   *
   * @param options - Generation options or format string
   * @returns Generated ID string
   */
  static generate(options?: GenerateOptions | IDFormat): string {
    // Allow string shorthand for format
    if (typeof options === 'string') {
      options = { format: options };
    }

    const { format = 'nanoid', length = 21, alphabet = BASE62 } = options ?? {};

    if (format === 'uuid') {
      return uuidv7();
    }

    // Use default nanoid if using standard config
    if (alphabet === BASE62 && length === 21) {
      return this.nanoid();
    }

    // Use cached custom generator
    return this.cached(alphabet, length)();
  }

  private static cached(alphabet: string, length: number): () => string {
    const key = `${alphabet}:${length}`;
    let gen = this.cache.get(key);
    if (!gen) {
      gen = customAlphabet(alphabet, length);
      this.cache.set(key, gen);
    }
    return gen;
  }
}
