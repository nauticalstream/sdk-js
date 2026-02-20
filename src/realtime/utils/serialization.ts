import { toJsonString, fromJsonString, type Message } from '@bufbuild/protobuf';
import type { GenMessage } from '@bufbuild/protobuf/codegenv2';

/**
 * Serialize a protobuf message to JSON string
 */
export function serializeProto<T extends Message>(
  schema: GenMessage<T>,
  message: T
): string {
  return toJsonString(schema, message);
}

/**
 * Deserialize a JSON string to protobuf message
 */
export function deserializeProto<T extends Message>(
  schema: GenMessage<T>,
  data: string | Buffer
): T {
  const jsonString = typeof data === 'string' ? data : data.toString('utf-8');
  return fromJsonString(schema, jsonString);
}
