import { chatTopics, platformTopics } from './chat.js';
import { presenceTopics } from './presence.js';
import { notificationTopics } from './notification.js';
import { workspaceTopics } from './workspace.js';

/**
 * Centralized MQTT topic definitions for all NauticalStream services.
 * 
 * Topic patterns:
 * - user/{userId} - User-specific platform events (chat, notifications, etc.)
 * - conv/{conversationId} - Conversation-specific chat events
 * - commands/chat/user/{userId}/* - Chat command topics (client→server, user-scoped)
 * - presence/{userId} - User presence updates
 * - workspace/{workspaceId}/* - Workspace-scoped topics
 */
export const TOPICS = {
  CHAT: chatTopics,
  PLATFORM: platformTopics,
  PRESENCE: presenceTopics,
  NOTIFICATION: notificationTopics,
  WORKSPACE: workspaceTopics,
} as const;

export { chatTopics, platformTopics, presenceTopics, notificationTopics, workspaceTopics };
