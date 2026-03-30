import type { PermissionClient } from '../client/permission-client';
import * as resource from '../core/resource';

export enum PermissionNamespace {
  USER = 'user',
  PLATFORM = 'platform',
  WORKSPACE = 'workspace',
  POST = 'post',
  FILE = 'file',
  ARTICLE = 'article',
  ARTICLE_TOPIC = 'article_topic',
  WORKSPACE_CATEGORY = 'workspace_category',
  WORKSPACE_FEATURE = 'workspace_feature',
  EVENT = 'event',
  EVENT_TICKET_SPECIFICATION = 'event_ticket_specification',
  TOUR = 'tour',
  CRUISE = 'cruise',
  COLLECTION = 'collection',
  COMMENT = 'comment',
  LIKE = 'like',
  FOLLOW = 'follow',
  CUSTOMER = 'customer',
  LEAD = 'lead',
  LEAD_STAGE = 'lead_stage',
  CHAT_CONVERSATION = 'chat_conversation',
  CHAT_MESSAGE = 'chat_message',
  CHAT_MESSAGE_REQUEST = 'chat_message_request',
  PLACE = 'place',
  NOTE = 'note',
  BOAT = 'boat',
  ITINERARY = 'itinerary',
  STREAM = 'stream',
  BUSINESS = 'business',
  CATALOG_PRODUCT = 'catalog_product',
  PRICE_CONFIGURATION = 'price_configuration',
  CONNECTED_EMAIL_ACCOUNT = 'connected_email_account',
  VERIFICATION_SESSION = 'verification_session',
  STORAGE_COLLECTION = 'storage_collection',
}

type ResourceNamespace = PermissionNamespace | string;
type ResourcePermissionValue = string;

export enum PostPermission {
  VIEW = 'view',
  EDIT = 'edit',
  DELETE = 'delete',
  SHARE = 'share',
}

export enum ArticlePermission {
  VIEW = 'view',
  EDIT = 'edit',
  DELETE = 'delete',
  SHARE = 'share',
}

export type ArticleTopicPermission = 'view' | 'edit' | 'delete';

export enum FilePermission {
  VIEW = 'view',
  EDIT = 'edit',
  DELETE = 'delete',
  SHARE = 'share',
}

export type CollectionPermission = 'view' | 'edit' | 'delete' | 'add_items' | 'remove_items';
export type StorageCollectionPermission = 'view' | 'edit' | 'delete' | 'add_items' | 'remove_items';
export type CommentPermission = 'view' | 'create' | 'edit' | 'delete' | 'reply';
export type LikePermission = 'create' | 'delete';
export type FollowPermission = 'create' | 'delete';
export type WorkspaceCategoryPermission = 'view' | 'create' | 'update' | 'delete';
export type WorkspaceFeaturePermission = 'view' | 'edit' | 'delete';
export type EventPermission = 'view' | 'edit' | 'delete' | 'publish';
export type EventTicketSpecificationPermission = 'view' | 'edit' | 'delete';
export type TourPermission = 'view' | 'edit' | 'delete' | 'publish';
export type CruisePermission = 'view' | 'edit' | 'delete' | 'publish';
export type BoatPermission = 'view' | 'edit' | 'delete' | 'publish';
export type ItineraryPermission = 'view' | 'edit' | 'delete' | 'publish';
export type StreamPermission = 'view' | 'edit' | 'delete' | 'publish';
export type BusinessPermission = 'view' | 'edit' | 'delete' | 'verify';
export type CatalogProductPermission = 'view' | 'edit' | 'delete' | 'publish';
export type PriceConfigurationPermission = 'view' | 'edit' | 'delete';
export type ConnectedEmailAccountPermission = 'view' | 'edit' | 'delete' | 'send';
export type VerificationSessionPermission = 'view' | 'update' | 'cancel';
export type CustomerPermission = 'view' | 'edit' | 'delete' | 'export';
export type LeadPermission = 'view' | 'edit' | 'delete' | 'move_stage' | 'convert';
export type LeadStagePermission = 'view' | 'create' | 'update' | 'delete' | 'reorder';
export type ChatConversationPermission =
  | 'view'
  | 'send_message'
  | 'add_participant'
  | 'remove_participant'
  | 'archive'
  | 'delete'
  | 'update_settings';
export type ChatMessagePermission = 'view' | 'edit' | 'delete' | 'react';
export type ChatMessageRequestPermission = 'view' | 'edit' | 'delete' | 'assign' | 'resolve';
export type PlacePermission = 'view' | 'edit' | 'delete';
export type NotePermission = 'view' | 'edit' | 'delete';

export interface ResourcePermissionsOptions<TPermission extends ResourcePermissionValue = string> {
  defaultListPermission?: TPermission | string;
}

export class ResourcePermissions<TPermission extends ResourcePermissionValue = string> {
  constructor(
    protected readonly client: PermissionClient,
    protected readonly namespace: ResourceNamespace,
    protected readonly options: ResourcePermissionsOptions<TPermission> = {}
  ) {}

  hasPermission(resourceId: string, userId: string, permission: TPermission | string): Promise<boolean> {
    return resource.hasPermission(this.client, this.namespace, resourceId, userId, permission);
  }

  requirePermission(resourceId: string, userId: string, permission: TPermission | string): Promise<void> {
    return resource.requirePermission(this.client, this.namespace, resourceId, userId, permission);
  }

  grantOwnership(resourceId: string, userId: string): Promise<void> {
    return resource.grantOwnership(this.client, this.namespace, resourceId, userId);
  }

  grantPermission(resourceId: string, userId: string, permission: TPermission | string): Promise<void> {
    return resource.grantPermission(this.client, this.namespace, resourceId, userId, permission);
  }

  revokePermission(resourceId: string, userId: string, permission: TPermission | string): Promise<void> {
    return resource.revokePermission(this.client, this.namespace, resourceId, userId, permission);
  }

  linkToWorkspace(resourceId: string, workspaceId: string): Promise<void> {
    return resource.linkToWorkspace(this.client, this.namespace, resourceId, workspaceId);
  }

  unlinkFromWorkspace(resourceId: string, workspaceId: string): Promise<void> {
    return resource.unlinkFromWorkspace(this.client, this.namespace, resourceId, workspaceId);
  }

  list(userId: string, permission?: TPermission | string): Promise<string[]> {
    return resource.listResources(
      this.client,
      this.namespace,
      userId,
      permission ?? this.options.defaultListPermission ?? 'view'
    );
  }

  cleanup(resourceId: string): Promise<void> {
    return resource.cleanupResource(this.client, this.namespace, resourceId);
  }
}

export class PostsPermissions extends ResourcePermissions<PostPermission> {
  constructor(client: PermissionClient) {
    super(client, PermissionNamespace.POST, { defaultListPermission: PostPermission.VIEW });
  }
}

export class ArticlesPermissions extends ResourcePermissions<ArticlePermission> {
  constructor(client: PermissionClient) {
    super(client, PermissionNamespace.ARTICLE, { defaultListPermission: ArticlePermission.VIEW });
  }
}

export class FilesPermissions extends ResourcePermissions<FilePermission> {
  constructor(client: PermissionClient) {
    super(client, PermissionNamespace.FILE, { defaultListPermission: FilePermission.VIEW });
  }
}