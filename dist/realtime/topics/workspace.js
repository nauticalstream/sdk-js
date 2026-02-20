"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.workspaceTopics = void 0;
/**
 * Workspace-related MQTT topics
 */
exports.workspaceTopics = {
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