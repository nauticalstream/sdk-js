"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.chatTopics = void 0;
/**
 * Chat-related MQTT topics
 */
exports.chatTopics = {
    /**
     * User-specific chat updates (messages, read receipts, etc.)
     * @param userId - The user ID
     */
    user: (userId) => `user/${userId}`,
    /**
     * Conversation-specific updates
     * @param conversationId - The conversation ID
     */
    conversation: (conversationId) => `conv/${conversationId}`,
    /**
     * Command topics for client→server communication
     */
    commands: {
        sendMessage: () => 'commands/chat/send',
        markRead: () => 'commands/chat/read',
        typing: () => 'commands/chat/typing',
    },
};
//# sourceMappingURL=chat.js.map