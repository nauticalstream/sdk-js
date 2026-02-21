import { customAlphabet } from 'nanoid';
/**
 * Centralized ID Generator
 * Provides consistent ID generation across all entities
 */
export class IDGenerator {
    static nanoid = customAlphabet('0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz', 21);
    /**
     * Generate a unique ID using base62 alphabet (21 characters)
     * Safe for URLs and databases
     */
    static generate() {
        return this.nanoid();
    }
    /**
     * Generate a unique ID with custom length
     */
    static generateWithLength(length) {
        const customNanoid = customAlphabet('0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz', length);
        return customNanoid();
    }
    /**
     * Generate a unique ID with custom alphabet
     */
    static generateWithAlphabet(alphabet, length = 21) {
        const customNanoid = customAlphabet(alphabet, length);
        return customNanoid();
    }
}
//# sourceMappingURL=id-generator.js.map