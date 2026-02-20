/**
 * Centralized ID Generator
 * Provides consistent ID generation across all entities
 */
export declare class IDGenerator {
    private static readonly nanoid;
    /**
     * Generate a unique ID using base62 alphabet (21 characters)
     * Safe for URLs and databases
     */
    static generate(): string;
    /**
     * Generate a unique ID with custom length
     */
    static generateWithLength(length: number): string;
    /**
     * Generate a unique ID with custom alphabet
     */
    static generateWithAlphabet(alphabet: string, length?: number): string;
}
//# sourceMappingURL=id-generator.d.ts.map