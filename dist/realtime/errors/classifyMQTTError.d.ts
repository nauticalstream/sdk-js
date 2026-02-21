/**
 * Classify MQTT errors to determine if they should be retried
 * Only infrastructure errors (transient) inherit from SystemException
 * Domain errors (permanent) inherit from DomainException and should not retry
 */
export declare function classifyMQTTError(error: unknown): Error;
//# sourceMappingURL=classifyMQTTError.d.ts.map