/**
 * Derive a JetStream stream name from a protobuf typeName.
 *
 * Extracts the domain/package (first segment) and appends `-events`.
 * This follows the convention where all events for a domain are stored in `{domain}-events`.
 *
 * @example
 * deriveStream('chat.v1.ChatMessageSent') → 'chat-events'
 * deriveStream('user.v1.UserProfileUpdated') → 'user-events'
 * deriveStream('workspace.v1.WorkspaceCreated') → 'workspace-events'
 * deriveStream('presence.v1.PresenceChanged') → 'presence-events'
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
  return `${domain}-events`;
}
