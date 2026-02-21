import { customAlphabet } from 'nanoid';
const BASE62 = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
/**
 * Centralized ID Generator
 *
 * Uses nanoid (CSPRNG) with a base62 alphabet (0-9A-Za-z).
 * Base62 is fully URL-safe — no percent-encoding ever required.
 *
 * Entropy: 21 chars × log₂(62) ≈ 125 bits — slightly more than UUID v4 (122 bits).
 * Collision probability reaches ~1% only after ~2.3 × 10¹⁸ generated IDs.
 */
export class IDGenerator {
    static nanoid = customAlphabet(BASE62, 21);
    /** Cache generators keyed by `${alphabet}:${length}` to avoid re-running setup on every call. */
    static cache = new Map();
    /**
     * Generate a unique ID using base62 alphabet (21 characters).
     * URL-safe and database-safe.
     */
    static generate() {
        return this.nanoid();
    }
    /**
     * Generate a unique ID with a custom length (base62 alphabet).
     */
    static generateWithLength(length) {
        return this.cached(BASE62, length)();
    }
    /**
     * Generate a unique ID with a custom alphabet and optional length.
     */
    static generateWithAlphabet(alphabet, length = 21) {
        return this.cached(alphabet, length)();
    }
    static cached(alphabet, length) {
        const key = `${alphabet}:${length}`;
        let gen = this.cache.get(key);
        if (!gen) {
            gen = customAlphabet(alphabet, length);
            this.cache.set(key, gen);
        }
        return gen;
    }
}
//# sourceMappingURL=id-generator.js.map