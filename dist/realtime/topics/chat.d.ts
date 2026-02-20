/**
 * Chat-related MQTT topics
 */
export declare const chatTopics: {
    /**
     * User-specific chat updates (messages, read receipts, etc.)
     * @param userId - The user ID
     */
    readonly user: (userId: string) => string;
    /**
     * Conversation-specific updates
     * @param conversationId - The conversation ID
     */
    readonly conversation: (conversationId: string) => string;
    /**
     * Command topics for client→server communication
     */
    readonly commands: {
        readonly sendMessage: () => string;
        readonly markRead: () => string;
        readonly typing: () => string;
    };
};
//# sourceMappingURL=chat.d.ts.map