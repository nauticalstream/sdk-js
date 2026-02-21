/**
 * Derives a NATS subject from a protobuf message typeName.
 * 
 * Converts protobuf typeName format ("package.version.MessageName") to NATS subject format
 * ("package.version.message-name"). This follows the pattern:
 * - Keeps package and version as-is
 * - Converts MessageName to kebab-case
 * 
 * Examples:
 * - "user.v1.GetUserRequest" → "user.v1.get-user-request"
 * - "workspace.v1.WorkspaceCreated" → "workspace.v1.workspace-created"
 * - "chat.v1.ConversationParticipantAdded" → "chat.v1.conversation-participant-added"
 * 
 * @param typeName - The protobuf message typeName (e.g., from schema.typeName)
 * @returns The derived NATS subject
 * @throws Error if typeName is undefined or has invalid format
 */
export function deriveSubject(typeName: string | undefined): string {
  if (!typeName) {
    throw new Error('Schema typeName is required for subject derivation');
  }
  
  const parts = typeName.split('.');
  
  if (parts.length < 3) {
    throw new Error(
      `Invalid protobuf typeName: "${typeName}". Expected format: "package.version.MessageName"`
    );
  }

  // Take package and version (first 2 parts)
  const packageAndVersion = parts.slice(0, 2);
  
  // Take message name (everything after version)
  const messageName = parts.slice(2).join('.');
  
  // Convert MessageName to kebab-case
  const kebabCaseName = messageName
    // Insert hyphen before uppercase letters (except first character)
    .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
    // Convert to lowercase
    .toLowerCase();

  return [...packageAndVersion, kebabCaseName].join('.');
}
