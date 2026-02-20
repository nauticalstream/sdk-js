/**
 * Create MQTT User Properties with trace context and correlation metadata
 * Returns Record<string, string> for MQTT v5 userProperties
 *
 * If no OTel SDK is registered, trace context injection is a silent no-op.
 * Correlation ID and timestamp are always added for log correlation.
 *
 * @param correlationId - Unique ID for message tracing across services
 * @param source - Optional service name that published the message
 */
export declare function createPublishProperties(correlationId: string, source?: string): Record<string, string>;
/**
 * Wrap a publish operation in an OTel producer span
 * Records topic, message size, and any errors
 *
 * If no OTel SDK is registered, this is a silent no-op wrapper.
 *
 * @param topic - MQTT topic being published to
 * @param messageSize - Size of the message payload in bytes
 * @param fn - Async function to execute within the span
 */
export declare function withPublishSpan(topic: string, messageSize: number, fn: () => Promise<void>): Promise<void>;
/**
 * Wrap a message handler in an OTel consumer span
 * Extracts trace context from MQTT userProperties and creates a child span
 *
 * If no OTel SDK is registered, this is a silent no-op wrapper.
 *
 * @param topic - MQTT topic the message was received on
 * @param userProperties - MQTT v5 userProperties containing trace context
 * @param fn - Async function to execute within the span
 */
export declare function withMessageSpan(topic: string, userProperties: Record<string, string | string[]> | undefined, fn: () => Promise<void>): Promise<void>;
//# sourceMappingURL=telemetry.d.ts.map