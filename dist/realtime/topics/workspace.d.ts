/**
 * Workspace-related MQTT topics
 */
export declare const workspaceTopics: {
    /**
     * Workspace-wide updates
     * @param workspaceId - The workspace ID
     */
    readonly updates: (workspaceId: string) => string;
    /**
     * Workspace member updates
     * @param workspaceId - The workspace ID
     */
    readonly members: (workspaceId: string) => string;
};
//# sourceMappingURL=workspace.d.ts.map