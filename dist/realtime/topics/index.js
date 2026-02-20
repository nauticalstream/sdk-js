"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.workspaceTopics = exports.notificationTopics = exports.presenceTopics = exports.chatTopics = exports.TOPICS = void 0;
const chat_1 = require("./chat");
Object.defineProperty(exports, "chatTopics", { enumerable: true, get: function () { return chat_1.chatTopics; } });
const presence_1 = require("./presence");
Object.defineProperty(exports, "presenceTopics", { enumerable: true, get: function () { return presence_1.presenceTopics; } });
const notification_1 = require("./notification");
Object.defineProperty(exports, "notificationTopics", { enumerable: true, get: function () { return notification_1.notificationTopics; } });
const workspace_1 = require("./workspace");
Object.defineProperty(exports, "workspaceTopics", { enumerable: true, get: function () { return workspace_1.workspaceTopics; } });
/**
 * Centralized MQTT topic definitions for all NauticalStream services.
 *
 * Topic patterns:
 * - user/{userId} - User-specific updates
 * - conv/{conversationId} - Conversation-specific updates
 * - presence/{userId} - User presence updates
 * - workspace/{workspaceId}/* - Workspace-scoped topics
 * - commands/* - Command topics for client→server communication
 */
exports.TOPICS = {
    CHAT: chat_1.chatTopics,
    PRESENCE: presence_1.presenceTopics,
    NOTIFICATION: notification_1.notificationTopics,
    WORKSPACE: workspace_1.workspaceTopics,
};
//# sourceMappingURL=index.js.map