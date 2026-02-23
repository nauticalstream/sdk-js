/**
 * Derive a NATS subject from a protobuf typeName.
 *
 * Converts "package.version.MessageName" → "package.version.message-name".
 * The package and version segments are preserved as-is; the message name
 * is converted to kebab-case.
 *
 * @example
 * deriveSubject('workspace.v1.WorkspaceCreated') → 'workspace.v1.workspace-created'
 * deriveSubject('user.v1.GetUserRequest')         → 'user.v1.get-user-request'
 *
 * @throws Error when typeName is undefined or has fewer than 3 dot-separated parts.
 */
export function deriveSubject(typeName: string | undefined): string {
  if (!typeName) throw new Error('Schema typeName is required for subject derivation');

  const parts = typeName.split('.');
  if (parts.length < 3) {
    throw new Error(
      `Invalid protobuf typeName: "${typeName}". Expected format: "package.version.MessageName"`
    );
  }

  const packageAndVersion = parts.slice(0, 2);
  const messageName = parts.slice(2).join('.');
  const kebab = messageName.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase();

  return [...packageAndVersion, kebab].join('.');
}
