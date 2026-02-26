/**
 * Derive a JetStream consumer name from service name and protobuf typeName.
 *
 * Combines the service name with the kebab-cased event name to create
 * a unique, readable consumer name for durable subscriptions.
 *
 * Format: `{serviceName}-{event-name}`
 *
 * @example
 * deriveConsumer('realtime-publisher-service', 'chat.v1.ChatMessageSent')
 *   → 'realtime-publisher-service-chat-message-sent'
 *
 * deriveConsumer('elasticsearch-adapter', 'user.v1.UserProfileUpdated')
 *   → 'elasticsearch-adapter-user-profile-updated'
 *
 * @throws Error when serviceName or typeName is undefined or invalid.
 */
export function deriveConsumer(serviceName: string | undefined, typeName: string | undefined): string {
  if (!serviceName) throw new Error('Service name is required for consumer derivation');
  if (!typeName) throw new Error('Schema typeName is required for consumer derivation');

  const parts = typeName.split('.');
  if (parts.length < 3) {
    throw new Error(
      `Invalid protobuf typeName: "${typeName}". Expected format: "package.version.MessageName"`
    );
  }

  // Extract message name and convert to kebab-case
  const messageName = parts.slice(2).join('.');
  const kebab = messageName.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase();

  return `${serviceName}-${kebab}`;
}
