"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.presenceTopics = void 0;
/**
 * Presence-related MQTT topics
 */
exports.presenceTopics = {
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