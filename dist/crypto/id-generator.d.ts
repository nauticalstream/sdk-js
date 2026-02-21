/**
 * Centralized ID Generator
 *
 * Uses nanoid (CSPRNG) with a base62 alphabet (0-9A-Za-z).
 * Base62 is fully URL-safe — no percent-encoding ever required.
 *
 * Entropy: 21 chars × log₂(62) ≈ 125 bits — slightly more than UUID v4 (122 bits).
 * Collision probability reaches ~1% only after ~2.3 × 10¹⁸ generated IDs.
 */
export declare class IDGenerator {
    private static readonly nanoid;
    /** Cache generators keyed by `${alphabet}:${length}` to avoid re-running setup on every call. */
    private static readonly cache;
    /**
     * Generate a unique ID using base62 alphabet (21 characters).
     * URL-safe and database-safe.
     */
    static generate(): string;
    /**
     * Generate a unique ID with a custom length (base62 alphabet).
     */
    static generateWithLength(length: number): string;
    /**
     * Generate a unique ID with a custom alphabet and optional length.
     */
    static generateWithAlphabet(alphabet: string, length?: number): string;
    private static cached;
}
//# sourceMappingURL=id-generator.d.ts.map