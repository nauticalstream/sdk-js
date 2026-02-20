import { type Message } from '@bufbuild/protobuf';
import type { GenMessage } from '@bufbuild/protobuf/codegenv2';
/**
 * Serialize a protobuf message to JSON string
 */
export declare function serializeProto<T extends Message>(schema: GenMessage<T>, message: T): string;
/**
 * Deserialize a JSON string to protobuf message
 */
export declare function deserializeProto<T extends Message>(schema: GenMessage<T>, data: string | Buffer): T;
//# sourceMappingURL=serialization.d.ts.map