"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.IDGenerator = void 0;
const nanoid_1 = require("nanoid");
/**
 * Centralized ID Generator
 * Provides consistent ID generation across all entities
 */
class IDGenerator {
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
        const customNanoid = (0, nanoid_1.customAlphabet)('0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz', length);
        return customNanoid();
    }
    /**
     * Generate a unique ID with custom alphabet
     */
    static generateWithAlphabet(alphabet, length = 21) {
        const customNanoid = (0, nanoid_1.customAlphabet)(alphabet, length);
        return customNanoid();
    }
}
exports.IDGenerator = IDGenerator;
IDGenerator.nanoid = (0, nanoid_1.customAlphabet)('0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz', 21);
//# sourceMappingURL=id-generator.js.map