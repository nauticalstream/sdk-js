/**
 * Presence-related MQTT topics
 */
export declare const presenceTopics: {
    /**
     * User presence updates (online, offline, away, etc.)
     * @param userId - The user ID
     */
    readonly user: (userId: string) => string;
    /**
     * Workspace-scoped presence
     * @param workspaceId - The workspace ID
     */
    readonly workspace: (workspaceId: string) => string;
};
//# sourceMappingURL=presence.d.ts.map