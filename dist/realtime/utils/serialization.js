"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.serializeProto = serializeProto;
exports.deserializeProto = deserializeProto;
const protobuf_1 = require("@bufbuild/protobuf");
/**
 * Serialize a protobuf message to JSON string
 */
function serializeProto(schema, message) {
    return (0, protobuf_1.toJsonString)(schema, message);
}
/**
 * Deserialize a JSON string to protobuf message
 */
function deserializeProto(schema, data) {
    const jsonString = typeof data === 'string' ? data : data.toString('utf-8');
    return (0, protobuf_1.fromJsonString)(schema, jsonString);
}
//# sourceMappingURL=serialization.js.map