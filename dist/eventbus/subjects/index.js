/**
 * NATS Subject definitions for all services
 * Single source of truth for event routing
 *
 * Convention: <service>.<entity>.<action>
 * - Events:  chat.message.sent, storage.image.uploaded
 * - Queries: storage.image.has, places.location.has-batch
 * - Wildcards: storage.> (all storage), *.*.deleted (all deletes)
 */
export const SUBJECTS = {
    // ============================================
    // CHAT
    // ============================================
    CHAT: {
        // Message commands (incoming - triggers)
        MESSAGE_SEND: 'chat.message.send',
        MESSAGE_MARK_READ: 'chat.message.mark-read',
        // Message events (outgoing - after operations)
        MESSAGE_SENT: 'chat.message.sent',
        MESSAGE_DELIVERED: 'chat.message.delivered',
        MESSAGE_READ: 'chat.message.read',
        MESSAGE_STATUS_UPDATED: 'chat.message.status-updated',
        // Conversation events
        CONVERSATION_CREATED: 'chat.conversation.created',
        CONVERSATION_UPDATED: 'chat.conversation.updated',
        CONVERSATION_DELETED: 'chat.conversation.deleted',
        // Participant events
        PARTICIPANT_ADDED: 'chat.participant.added',
        PARTICIPANT_REMOVED: 'chat.participant.removed',
        PARTICIPANT_UPDATED: 'chat.participant.updated',
        // Presence events
        USER_ONLINE: 'chat.user.online',
        USER_OFFLINE: 'chat.user.offline',
        USER_TYPING: 'chat.user.typing',
        // Queries (request/reply)
        QUERIES: {
            GET_CONVERSATION_PARTICIPANTS: 'chat.conversation.get-participants',
            GET_USER_TOPICS: 'chat.user.get-topics',
            IS_PARTICIPANT: 'chat.conversation.is-participant',
        },
    },
    // ============================================
    // PLATFORM (cross-service delivery)
    // ============================================
    PLATFORM: {
        // Generic event envelope — websocket-service fans out to Socket.IO rooms
        EVENT: 'platform.event',
    },
    // ============================================
    // USER
    // ============================================
    USER: {
        CREATED: 'user.user.created',
        UPDATED: 'user.user.updated',
        DELETED: 'user.user.deleted',
        PROFILE_UPDATED: 'user.user.profile-updated',
        // Queries (request/reply)
        QUERIES: {
            GET_BY_ID: 'user.user.get-by-id',
            GET_BY_EMAIL: 'user.user.get-by-email',
        },
    },
    // ============================================
    // WORKSPACE
    // ============================================
    WORKSPACE: {
        // Workspace events
        CREATED: 'workspace.workspace.created',
        UPDATED: 'workspace.workspace.updated',
        DELETED: 'workspace.workspace.deleted',
        PUBLISHED: 'workspace.workspace.published',
        UNPUBLISHED: 'workspace.workspace.unpublished',
        SUSPENDED: 'workspace.workspace.suspended',
        COMPANY_INFO_UPDATED: 'workspace.company-info.updated',
        // Member events
        MEMBER_ADDED: 'workspace.member.added',
        MEMBER_UPDATED: 'workspace.member.updated',
        MEMBER_REMOVED: 'workspace.member.removed',
        // Amenity events
        AMENITY_CREATED: 'workspace.amenity.created',
        AMENITY_UPDATED: 'workspace.amenity.updated',
        AMENITY_DELETED: 'workspace.amenity.deleted',
        AMENITY_ACTIVATED: 'workspace.amenity.activated',
        AMENITY_DEACTIVATED: 'workspace.amenity.deactivated',
        AMENITY_DEPRECATED: 'workspace.amenity.deprecated',
        // Category events
        CATEGORY_CREATED: 'workspace.category.created',
        CATEGORY_UPDATED: 'workspace.category.updated',
        CATEGORY_DELETED: 'workspace.category.deleted',
        CATEGORY_ACTIVATED: 'workspace.category.activated',
        CATEGORY_DEACTIVATED: 'workspace.category.deactivated',
        CATEGORY_DEPRECATED: 'workspace.category.deprecated',
        CATEGORY_AMENITY_ASSIGNED: 'workspace.category.amenity-assigned',
        CATEGORY_AMENITY_REMOVED: 'workspace.category.amenity-removed',
        // Feature events
        FEATURE_CREATED: 'workspace.feature.created',
        FEATURE_UPDATED: 'workspace.feature.updated',
        FEATURE_DELETED: 'workspace.feature.deleted',
        // Queries (request/reply)
        QUERIES: {
            GET_BY_ID: 'workspace.workspace.get-by-id',
            GET_MANY: 'workspace.workspace.get-many',
        },
    },
    // ============================================
    // SOCIAL
    // ============================================
    SOCIAL: {
        FOLLOW_CREATED: 'social.follow.created',
        FOLLOW_UPDATED: 'social.follow.updated',
        FOLLOW_DELETED: 'social.follow.deleted',
        LIKE_CREATED: 'social.like.created',
        LIKE_DELETED: 'social.like.deleted',
        COMMENT_CREATED: 'social.comment.created',
        COMMENT_UPDATED: 'social.comment.updated',
        COMMENT_DELETED: 'social.comment.deleted',
        // Queries (request/reply)
        QUERIES: {
            GET_FOLLOWED_WORKSPACE_IDS: 'social.follow.get-workspace-ids',
        },
    },
    // ============================================
    // POST
    // ============================================
    POST: {
        CREATED: 'post.post.created',
        UPDATED: 'post.post.updated',
        DELETED: 'post.post.deleted',
        PUBLISHED: 'post.post.published',
        UNPUBLISHED: 'post.post.unpublished',
        // Queries (request/reply)
        QUERIES: {
            VALIDATE_PUBLISH: 'post.post.validate-publish',
        },
    },
    // ============================================
    // PLACES
    // ============================================
    PLACES: {
        PLACE_CREATED: 'places.place.created',
        PLACE_UPDATED: 'places.place.updated',
        PLACE_DELETED: 'places.place.deleted',
        PLACE_SYNCED: 'places.place.synced',
        LOCATION_DELETED: 'places.location.deleted',
        // Queries (request/reply)
        QUERIES: {
            HAS_LOCATION: 'places.location.has',
            HAS_LOCATION_BATCH: 'places.location.has-batch',
        },
    },
    // ============================================
    // STORAGE
    // ============================================
    STORAGE: {
        IMAGE_UPLOADED: 'storage.image.uploaded',
        IMAGE_PROCESSED: 'storage.image.processed',
        IMAGE_DELETED: 'storage.image.deleted',
        VIDEO_UPLOADED: 'storage.video.uploaded',
        VIDEO_PROCESSED: 'storage.video.processed',
        VIDEO_DELETED: 'storage.video.deleted',
        DOCUMENT_UPLOADED: 'storage.document.uploaded',
        DOCUMENT_DELETED: 'storage.document.deleted',
        FILE_REFERENCED: 'storage.file-reference.created',
        FILE_UNREFERENCED: 'storage.file-reference.deleted',
        COLLECTION_CREATED: 'storage.collection.created',
        COLLECTION_DELETED: 'storage.collection.deleted',
        COLLECTION_REFERENCED: 'storage.collection.referenced',
        COLLECTION_UNREFERENCED: 'storage.collection.unreferenced',
        // Queries (request/reply)
        QUERIES: {
            HAS_IMAGE: 'storage.image.has',
            HAS_IMAGE_BATCH: 'storage.image.has-batch',
            HAS_FILE: 'storage.file-reference.has',
            HAS_FILE_BATCH: 'storage.file-reference.has-batch',
        },
    },
};
//# sourceMappingURL=index.js.map