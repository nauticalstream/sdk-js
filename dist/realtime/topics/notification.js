/**
 * Notification-related MQTT topics
 */
export const notificationTopics = {
    /**
     * User-specific notifications
     * @param userId - The user ID
     */
    user: (userId) => `notification/${userId}`,
    /**
     * Workspace-scoped notifications
     * @param workspaceId - The workspace ID
     */
    workspace: (workspaceId) => `notification/workspace/${workspaceId}`,
};
//# sourceMappingURL=notification.js.map