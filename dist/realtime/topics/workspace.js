/**
 * Workspace-related MQTT topics
 */
export const workspaceTopics = {
    /**
     * Workspace-wide updates
     * @param workspaceId - The workspace ID
     */
    updates: (workspaceId) => `workspace/${workspaceId}/updates`,
    /**
     * Workspace member updates
     * @param workspaceId - The workspace ID
     */
    members: (workspaceId) => `workspace/${workspaceId}/members`,
};
//# sourceMappingURL=workspace.js.map