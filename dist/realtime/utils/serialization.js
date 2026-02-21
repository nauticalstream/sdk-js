import { toJsonString, fromJsonString } from '@bufbuild/protobuf';
/**
 * Serialize a protobuf message to JSON string
 */
export function serializeProto(schema, message) {
    return toJsonString(schema, message);
}
/**
 * Deserialize a JSON string to protobuf message
 */
export function deserializeProto(schema, data) {
    const jsonString = typeof data === 'string' ? data : data.toString('utf-8');
    return fromJsonString(schema, jsonString);
}
//# sourceMappingURL=serialization.js.map