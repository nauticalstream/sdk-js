/**
 * Serialize any value to a JSON string for MQTT transport.
 * Proto-generated types are plain objects at runtime — no schema or binary encoding needed.
 */
export function serialize(message) {
    return JSON.stringify(message);
}
/**
 * Deserialize a JSON string or Buffer from MQTT into a typed value.
 */
export function deserialize(data) {
    const json = typeof data === 'string' ? data : data.toString('utf-8');
    return JSON.parse(json);
}
//# sourceMappingURL=serialization.js.map