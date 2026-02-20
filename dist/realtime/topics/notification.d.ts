/**
 * Notification-related MQTT topics
 */
export declare const notificationTopics: {
    /**
     * User-specific notifications
     * @param userId - The user ID
     */
    readonly user: (userId: string) => string;
    /**
     * Workspace-scoped notifications
     * @param workspaceId - The workspace ID
     */
    readonly workspace: (workspaceId: string) => string;
};
//# sourceMappingURL=notification.d.ts.map