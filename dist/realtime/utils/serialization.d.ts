/**
 * Serialize any value to a JSON string for MQTT transport.
 * Proto-generated types are plain objects at runtime — no schema or binary encoding needed.
 */
export declare function serialize(message: unknown): string;
/**
 * Deserialize a JSON string or Buffer from MQTT into a typed value.
 */
export declare function deserialize<T>(data: string | Buffer): T;
//# sourceMappingURL=serialization.d.ts.map