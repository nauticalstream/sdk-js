/**
 * Presence-related MQTT topics
 */
export const presenceTopics = {
    /**
     * User presence updates (online, offline, away, etc.)
     * @param userId - The user ID
     */
    user: (userId) => `presence/${userId}`,
    /**
     * Workspace-scoped presence
     * @param workspaceId - The workspace ID
     */
    workspace: (workspaceId) => `presence/workspace/${workspaceId}`,
};
//# sourceMappingURL=presence.js.map