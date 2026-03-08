/**
 * Chat-related MQTT topics
 * Event topics published by server to clients
 * Command topics: client→server communication (user-scoped for long-lived connections)
 */
export const chatTopics = {
  /**
   * Conversation-specific events (messages, participant updates)
   * @param conversationId - The conversation ID
   */
  conversation: (conversationId: string) => `conv/${conversationId}`,

  /**
   * Command topics (client→server, user-scoped)
   * Payload includes conversationId to route to correct conversation
   */
  commands: {
    /**
     * Send message in conversation
     * @param userId - The user ID (auth context)
     * Payload: { conversationId, text, metadata?, ... }
     */
    sendMessage: (userId: string) => `commands/chat/user/${userId}/send`,
    
    /**
     * Mark message(s) as read in conversation
     * @param userId - The user ID (auth context)
     * Payload: { conversationId, messageId, ... }
     */
    markRead: (userId: string) => `commands/chat/user/${userId}/read`,
    
    /**
     * Mark message(s) as delivered in conversation
     * @param userId - The user ID (auth context)
     * Payload: { conversationId, messageId, ... }
     */
    markDelivered: (userId: string) => `commands/chat/user/${userId}/delivered`,
    
    /**
     * User typing indicator in conversation
     * @param userId - The user ID (auth context)
     * Payload: { conversationId, isTyping }
     */
    typing: (userId: string) => `commands/chat/user/${userId}/typing`,
  },
} as const;

/**
 * Platform-level topics for chat events, notifications, and system events
 * Published by server to clients on user-specific topics
 */
export const platformTopics = {
  /**
   * User-specific events: chat messages, read receipts, notifications, system alerts
   * Payload: { type: 'message.created' | 'message.read' | 'message.delivered' | 'notification' | ..., payload: {...} }
   * @param userId - The user ID
   */
  user: (userId: string) => `user/${userId}`,
} as const;
