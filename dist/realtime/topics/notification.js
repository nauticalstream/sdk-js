"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.notificationTopics = void 0;
/**
 * Notification-related MQTT topics
 */
exports.notificationTopics = {
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