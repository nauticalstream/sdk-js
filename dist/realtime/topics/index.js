import { chatTopics } from './chat';
import { presenceTopics } from './presence';
import { notificationTopics } from './notification';
import { workspaceTopics } from './workspace';
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
export const TOPICS = {
    CHAT: chatTopics,
    PRESENCE: presenceTopics,
    NOTIFICATION: notificationTopics,
    WORKSPACE: workspaceTopics,
};
export { chatTopics, presenceTopics, notificationTopics, workspaceTopics };
//# sourceMappingURL=index.js.map