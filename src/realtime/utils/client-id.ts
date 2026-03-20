import { randomUUID } from 'crypto';

/**
 * Generate a unique MQTT client ID.
 * 
 * Each MQTT connection requires a unique clientId. If duplicate clientIds connect,
 * the broker will disconnect the previous connection. This is especially important for:
 * - Web applications where users may have multiple browser tabs
 * - Microservices running multiple pods/instances
 * 
 * Format: `{prefix}:{identifier}:{uuid}`
 * 
 * @param prefix - Service or app name (e.g., 'chat-service', 'web-public')
 * @param identifier - User ID, service instance, or other identifier (optional)
 * @returns Unique client ID string
 * 
 * @example
 * ```typescript
 * // For microservices (multiple pods)
 * const clientId = generateClientId('chat-service', 'pod-1');
 * // Result: "chat-service:pod-1:550e8400-e29b-41d4-a716-446655440000"
 * 
 * // For web users (multiple tabs)
 * const clientId = generateClientId('web-public', userId);
 * // Result: "web-public:user-123:550e8400-e29b-41d4-a716-446655440000"
 * 
 * // Simple case
 * const clientId = generateClientId('my-app');
 * // Result: "my-app:550e8400-e29b-41d4-a716-446655440000"
 * ```
 */
export function generateClientId(prefix: string, identifier?: string): string {
  const uuid = randomUUID();
  
  if (identifier) {
    return `${prefix}:${identifier}:${uuid}`;
  }
  
  return `${prefix}:${uuid}`;
}
