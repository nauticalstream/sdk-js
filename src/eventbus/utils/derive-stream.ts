/**
 * Derive a JetStream stream name from a protobuf typeName.
 *
 * Extracts the domain/package (first segment) and converts to uppercase.
 * This follows the convention where all events for a domain are stored in uppercase stream names.
 *
 * @example
 * deriveStream('chat.v1.ChatMessageSent') → 'CHAT'
 * deriveStream('user.v1.UserProfileUpdated') → 'USER'
 * deriveStream('workspace.v1.WorkspaceCreated') → 'WORKSPACE'
 * deriveStream('presence.v1.PresenceChanged') → 'PRESENCE'
 * deriveStream('email.v1.EmailRouted') → 'EMAIL'
 *
 * @throws Error when typeName is undefined or has fewer than 2 dot-separated parts.
 */
export function deriveStream(typeName: string | undefined): string {
  if (!typeName) throw new Error('Schema typeName is required for stream derivation');

  const parts = typeName.split('.');
  if (parts.length < 2) {
    throw new Error(
      `Invalid protobuf typeName: "${typeName}". Expected format: "package.version.MessageName"`
    );
  }

  const domain = parts[0]; // e.g., 'chat', 'user', 'workspace'
  return domain.toUpperCase();
}
