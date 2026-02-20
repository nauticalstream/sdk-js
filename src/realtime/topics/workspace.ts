/**
 * Workspace-related MQTT topics
 */
export const workspaceTopics = {
  /**
   * Workspace-wide updates
   * @param workspaceId - The workspace ID
   */
  updates: (workspaceId: string) => `workspace/${workspaceId}/updates`,

  /**
   * Workspace member updates
   * @param workspaceId - The workspace ID
   */
  members: (workspaceId: string) => `workspace/${workspaceId}/members`,
} as const;
