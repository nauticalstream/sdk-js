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
export declare const TOPICS: {
    readonly CHAT: {
        readonly user: (userId: string) => string;
        readonly conversation: (conversationId: string) => string;
        readonly commands: {
            readonly sendMessage: () => string;
            readonly markRead: () => string;
            readonly typing: () => string;
        };
    };
    readonly PRESENCE: {
        readonly user: (userId: string) => string;
        readonly workspace: (workspaceId: string) => string;
    };
    readonly NOTIFICATION: {
        readonly user: (userId: string) => string;
        readonly workspace: (workspaceId: string) => string;
    };
    readonly WORKSPACE: {
        readonly updates: (workspaceId: string) => string;
        readonly members: (workspaceId: string) => string;
    };
};
export { chatTopics, presenceTopics, notificationTopics, workspaceTopics };
//# sourceMappingURL=index.d.ts.map