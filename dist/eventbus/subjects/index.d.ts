/**
 * NATS Subject definitions for all services
 * Single source of truth for event routing
 *
 * Convention: <service>.<entity>.<action>
 * - Events:  chat.message.sent, storage.image.uploaded
 * - Queries: storage.image.has, places.location.has-batch
 * - Wildcards: storage.> (all storage), *.*.deleted (all deletes)
 */
export declare const SUBJECTS: {
    readonly CHAT: {
        readonly MESSAGE_SEND: "chat.message.send";
        readonly MESSAGE_MARK_READ: "chat.message.mark-read";
        readonly MESSAGE_SENT: "chat.message.sent";
        readonly MESSAGE_DELIVERED: "chat.message.delivered";
        readonly MESSAGE_READ: "chat.message.read";
        readonly MESSAGE_STATUS_UPDATED: "chat.message.status-updated";
        readonly CONVERSATION_CREATED: "chat.conversation.created";
        readonly CONVERSATION_UPDATED: "chat.conversation.updated";
        readonly CONVERSATION_DELETED: "chat.conversation.deleted";
        readonly PARTICIPANT_ADDED: "chat.participant.added";
        readonly PARTICIPANT_REMOVED: "chat.participant.removed";
        readonly PARTICIPANT_UPDATED: "chat.participant.updated";
        readonly USER_ONLINE: "chat.user.online";
        readonly USER_OFFLINE: "chat.user.offline";
        readonly USER_TYPING: "chat.user.typing";
        readonly QUERIES: {
            readonly GET_CONVERSATION_PARTICIPANTS: "chat.conversation.get-participants";
            readonly GET_USER_TOPICS: "chat.user.get-topics";
            readonly IS_PARTICIPANT: "chat.conversation.is-participant";
        };
    };
    readonly PLATFORM: {
        readonly EVENT: "platform.event";
    };
    readonly USER: {
        readonly CREATED: "user.user.created";
        readonly UPDATED: "user.user.updated";
        readonly DELETED: "user.user.deleted";
        readonly PROFILE_UPDATED: "user.user.profile-updated";
        readonly QUERIES: {
            readonly GET_BY_ID: "user.user.get-by-id";
            readonly GET_BY_EMAIL: "user.user.get-by-email";
        };
    };
    readonly WORKSPACE: {
        readonly CREATED: "workspace.workspace.created";
        readonly UPDATED: "workspace.workspace.updated";
        readonly DELETED: "workspace.workspace.deleted";
        readonly PUBLISHED: "workspace.workspace.published";
        readonly UNPUBLISHED: "workspace.workspace.unpublished";
        readonly SUSPENDED: "workspace.workspace.suspended";
        readonly COMPANY_INFO_UPDATED: "workspace.company-info.updated";
        readonly MEMBER_ADDED: "workspace.member.added";
        readonly MEMBER_UPDATED: "workspace.member.updated";
        readonly MEMBER_REMOVED: "workspace.member.removed";
        readonly AMENITY_CREATED: "workspace.amenity.created";
        readonly AMENITY_UPDATED: "workspace.amenity.updated";
        readonly AMENITY_DELETED: "workspace.amenity.deleted";
        readonly AMENITY_ACTIVATED: "workspace.amenity.activated";
        readonly AMENITY_DEACTIVATED: "workspace.amenity.deactivated";
        readonly AMENITY_DEPRECATED: "workspace.amenity.deprecated";
        readonly CATEGORY_CREATED: "workspace.category.created";
        readonly CATEGORY_UPDATED: "workspace.category.updated";
        readonly CATEGORY_DELETED: "workspace.category.deleted";
        readonly CATEGORY_ACTIVATED: "workspace.category.activated";
        readonly CATEGORY_DEACTIVATED: "workspace.category.deactivated";
        readonly CATEGORY_DEPRECATED: "workspace.category.deprecated";
        readonly CATEGORY_AMENITY_ASSIGNED: "workspace.category.amenity-assigned";
        readonly CATEGORY_AMENITY_REMOVED: "workspace.category.amenity-removed";
        readonly FEATURE_CREATED: "workspace.feature.created";
        readonly FEATURE_UPDATED: "workspace.feature.updated";
        readonly FEATURE_DELETED: "workspace.feature.deleted";
        readonly QUERIES: {
            readonly GET_BY_ID: "workspace.workspace.get-by-id";
            readonly GET_MANY: "workspace.workspace.get-many";
        };
    };
    readonly SOCIAL: {
        readonly FOLLOW_CREATED: "social.follow.created";
        readonly FOLLOW_UPDATED: "social.follow.updated";
        readonly FOLLOW_DELETED: "social.follow.deleted";
        readonly LIKE_CREATED: "social.like.created";
        readonly LIKE_DELETED: "social.like.deleted";
        readonly COMMENT_CREATED: "social.comment.created";
        readonly COMMENT_UPDATED: "social.comment.updated";
        readonly COMMENT_DELETED: "social.comment.deleted";
        readonly QUERIES: {
            readonly GET_FOLLOWED_WORKSPACE_IDS: "social.follow.get-workspace-ids";
        };
    };
    readonly POST: {
        readonly CREATED: "post.post.created";
        readonly UPDATED: "post.post.updated";
        readonly DELETED: "post.post.deleted";
        readonly PUBLISHED: "post.post.published";
        readonly UNPUBLISHED: "post.post.unpublished";
        readonly QUERIES: {
            readonly VALIDATE_PUBLISH: "post.post.validate-publish";
        };
    };
    readonly PLACES: {
        readonly PLACE_CREATED: "places.place.created";
        readonly PLACE_UPDATED: "places.place.updated";
        readonly PLACE_DELETED: "places.place.deleted";
        readonly PLACE_SYNCED: "places.place.synced";
        readonly LOCATION_DELETED: "places.location.deleted";
        readonly QUERIES: {
            readonly HAS_LOCATION: "places.location.has";
            readonly HAS_LOCATION_BATCH: "places.location.has-batch";
        };
    };
    readonly STORAGE: {
        readonly IMAGE_UPLOADED: "storage.image.uploaded";
        readonly IMAGE_PROCESSED: "storage.image.processed";
        readonly IMAGE_DELETED: "storage.image.deleted";
        readonly VIDEO_UPLOADED: "storage.video.uploaded";
        readonly VIDEO_PROCESSED: "storage.video.processed";
        readonly VIDEO_DELETED: "storage.video.deleted";
        readonly DOCUMENT_UPLOADED: "storage.document.uploaded";
        readonly DOCUMENT_DELETED: "storage.document.deleted";
        readonly FILE_REFERENCED: "storage.file-reference.created";
        readonly FILE_UNREFERENCED: "storage.file-reference.deleted";
        readonly COLLECTION_CREATED: "storage.collection.created";
        readonly COLLECTION_DELETED: "storage.collection.deleted";
        readonly COLLECTION_REFERENCED: "storage.collection.referenced";
        readonly COLLECTION_UNREFERENCED: "storage.collection.unreferenced";
        readonly QUERIES: {
            readonly HAS_IMAGE: "storage.image.has";
            readonly HAS_IMAGE_BATCH: "storage.image.has-batch";
            readonly HAS_FILE: "storage.file-reference.has";
            readonly HAS_FILE_BATCH: "storage.file-reference.has-batch";
        };
    };
};
export type ChatSubject = typeof SUBJECTS.CHAT[keyof typeof SUBJECTS.CHAT];
export type UserSubject = typeof SUBJECTS.USER[keyof typeof SUBJECTS.USER];
export type WorkspaceSubject = typeof SUBJECTS.WORKSPACE[keyof typeof SUBJECTS.WORKSPACE];
export type SocialSubject = typeof SUBJECTS.SOCIAL[keyof typeof SUBJECTS.SOCIAL];
export type PostSubject = typeof SUBJECTS.POST[keyof typeof SUBJECTS.POST];
export type PlacesSubject = typeof SUBJECTS.PLACES[keyof typeof SUBJECTS.PLACES];
export type StorageSubject = typeof SUBJECTS.STORAGE[keyof typeof SUBJECTS.STORAGE];
export type PlatformSubject = typeof SUBJECTS.PLATFORM[keyof typeof SUBJECTS.PLATFORM];
export type Subject = ChatSubject | UserSubject | WorkspaceSubject | SocialSubject | PostSubject | PlacesSubject | StorageSubject | PlatformSubject;
//# sourceMappingURL=index.d.ts.map