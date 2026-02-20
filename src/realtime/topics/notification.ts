/**
 * Notification-related MQTT topics
 */
export const notificationTopics = {
  /**
   * User-specific notifications
   * @param userId - The user ID
   */
  user: (userId: string) => `notification/${userId}`,

  /**
   * Workspace-scoped notifications
   * @param workspaceId - The workspace ID
   */
  workspace: (workspaceId: string) => `notification/workspace/${workspaceId}`,
} as const;
