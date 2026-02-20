/**
 * Chat-related MQTT topics
 */
export const chatTopics = {
  /**
   * User-specific chat updates (messages, read receipts, etc.)
   * @param userId - The user ID
   */
  user: (userId: string) => `user/${userId}`,

  /**
   * Conversation-specific updates
   * @param conversationId - The conversation ID
   */
  conversation: (conversationId: string) => `conv/${conversationId}`,

  /**
   * Command topics for client→server communication
   */
  commands: {
    sendMessage: () => 'commands/chat/send',
    markRead: () => 'commands/chat/read',
    typing: () => 'commands/chat/typing',
  },
} as const;
