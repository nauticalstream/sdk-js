/**
 * Presence-related MQTT topics
 */
export const presenceTopics = {
  /**
   * User presence updates (online, offline, away, etc.)
   * @param userId - The user ID
   */
  user: (userId: string) => `presence/${userId}`,

  /**
   * Workspace-scoped presence
   * @param workspaceId - The workspace ID
   */
  workspace: (workspaceId: string) => `presence/workspace/${workspaceId}`,
} as const;
