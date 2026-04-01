import { PermissionClient } from '../client/permission-client.js';
import * as platform from './platform.js';
import * as workspace from './workspace.js';
import {
  ArticlesPermissions,
  FilesPermissions,
  PermissionNamespace,
  PostsPermissions,
  ResourcePermissions,
  type ArticleTopicPermission,
  type BoatPermission,
  type BusinessPermission,
  type CatalogProductPermission,
  type CollectionPermission,
  type ChatConversationPermission,
  type ChatMessagePermission,
  type ChatMessageRequestPermission,
  type CommentPermission,
  type ConnectedEmailAccountPermission,
  type CruisePermission,
  type CustomerPermission,
  type EventPermission,
  type EventTicketSpecificationPermission,
  type FollowPermission,
  type ItineraryPermission,
  type LeadPermission,
  type LeadStagePermission,
  type LikePermission,
  type NotePermission,
  type PlacePermission,
  type PriceConfigurationPermission,
  type StorageCollectionPermission,
  type StreamPermission,
  type TourPermission,
  type VerificationSessionPermission,
  type WorkspaceCategoryPermission,
  type WorkspaceFeaturePermission,
} from '../domains/resource.js';
import { PlatformRole } from '../domains/platform.js';
import type { WorkspacePermission } from '../domains/workspace.js';
import { WorkspaceRole } from '../domains/workspace.js';
import { resetCircuitBreaker } from '../../resilience/index.js';
import type {
  PermissionsConfig,
} from '../types.js';

/** Permissions - shared permission management */
export class Permissions {
  private client: PermissionClient;

  readonly posts: PostsPermissions;
  readonly articles: ArticlesPermissions;
  readonly files: FilesPermissions;
  readonly articleTopics: ResourcePermissions<ArticleTopicPermission>;
  readonly workspaceCategories: ResourcePermissions<WorkspaceCategoryPermission>;
  readonly workspaceFeatures: ResourcePermissions<WorkspaceFeaturePermission>;
  readonly events: ResourcePermissions<EventPermission>;
  readonly eventTicketSpecifications: ResourcePermissions<EventTicketSpecificationPermission>;
  readonly tours: ResourcePermissions<TourPermission>;
  readonly cruises: ResourcePermissions<CruisePermission>;
  readonly boats: ResourcePermissions<BoatPermission>;
  readonly itineraries: ResourcePermissions<ItineraryPermission>;
  readonly streams: ResourcePermissions<StreamPermission>;
  readonly businesses: ResourcePermissions<BusinessPermission>;
  readonly catalogProducts: ResourcePermissions<CatalogProductPermission>;
  readonly priceConfigurations: ResourcePermissions<PriceConfigurationPermission>;
  readonly connectedEmailAccounts: ResourcePermissions<ConnectedEmailAccountPermission>;
  readonly verificationSessions: ResourcePermissions<VerificationSessionPermission>;
  readonly collections: ResourcePermissions<CollectionPermission>;
  readonly storageCollections: ResourcePermissions<StorageCollectionPermission>;
  readonly comments: ResourcePermissions<CommentPermission>;
  readonly likes: ResourcePermissions<LikePermission>;
  readonly follows: ResourcePermissions<FollowPermission>;
  readonly customers: ResourcePermissions<CustomerPermission>;
  readonly leads: ResourcePermissions<LeadPermission>;
  readonly leadStages: ResourcePermissions<LeadStagePermission>;
  readonly chatConversations: ResourcePermissions<ChatConversationPermission>;
  readonly chatMessages: ResourcePermissions<ChatMessagePermission>;
  readonly chatMessageRequests: ResourcePermissions<ChatMessageRequestPermission>;
  readonly places: ResourcePermissions<PlacePermission>;
  readonly notes: ResourcePermissions<NotePermission>;

  private createResourceDomain<TPermission extends string>(
    namespace: PermissionNamespace,
    defaultListPermission?: TPermission
  ): ResourcePermissions<TPermission> {
    return new ResourcePermissions<TPermission>(
      this.client,
      namespace,
      defaultListPermission ? { defaultListPermission } : {}
    );
  }

  constructor(config: PermissionsConfig) {
    this.client = new PermissionClient(config);
    this.posts = new PostsPermissions(this.client);
    this.articles = new ArticlesPermissions(this.client);
    this.files = new FilesPermissions(this.client);
    this.articleTopics = this.createResourceDomain<ArticleTopicPermission>(PermissionNamespace.ARTICLE_TOPIC, 'view');
    this.workspaceCategories = this.createResourceDomain<WorkspaceCategoryPermission>(PermissionNamespace.WORKSPACE_CATEGORY, 'view');
    this.workspaceFeatures = this.createResourceDomain<WorkspaceFeaturePermission>(PermissionNamespace.WORKSPACE_FEATURE, 'view');
    this.events = this.createResourceDomain<EventPermission>(PermissionNamespace.EVENT, 'view');
    this.eventTicketSpecifications = this.createResourceDomain<EventTicketSpecificationPermission>(PermissionNamespace.EVENT_TICKET_SPECIFICATION, 'view');
    this.tours = this.createResourceDomain<TourPermission>(PermissionNamespace.TOUR, 'view');
    this.cruises = this.createResourceDomain<CruisePermission>(PermissionNamespace.CRUISE, 'view');
    this.boats = this.createResourceDomain<BoatPermission>(PermissionNamespace.BOAT, 'view');
    this.itineraries = this.createResourceDomain<ItineraryPermission>(PermissionNamespace.ITINERARY, 'view');
    this.streams = this.createResourceDomain<StreamPermission>(PermissionNamespace.STREAM, 'view');
    this.businesses = this.createResourceDomain<BusinessPermission>(PermissionNamespace.BUSINESS, 'view');
    this.catalogProducts = this.createResourceDomain<CatalogProductPermission>(PermissionNamespace.CATALOG_PRODUCT, 'view');
    this.priceConfigurations = this.createResourceDomain<PriceConfigurationPermission>(PermissionNamespace.PRICE_CONFIGURATION, 'view');
    this.connectedEmailAccounts = this.createResourceDomain<ConnectedEmailAccountPermission>(PermissionNamespace.CONNECTED_EMAIL_ACCOUNT, 'view');
    this.verificationSessions = this.createResourceDomain<VerificationSessionPermission>(PermissionNamespace.VERIFICATION_SESSION, 'view');
    this.collections = this.createResourceDomain<CollectionPermission>(PermissionNamespace.COLLECTION, 'view');
    this.storageCollections = this.createResourceDomain<StorageCollectionPermission>(PermissionNamespace.STORAGE_COLLECTION, 'view');
    this.comments = this.createResourceDomain<CommentPermission>(PermissionNamespace.COMMENT, 'view');
    this.likes = this.createResourceDomain<LikePermission>(PermissionNamespace.LIKE);
    this.follows = this.createResourceDomain<FollowPermission>(PermissionNamespace.FOLLOW);
    this.customers = this.createResourceDomain<CustomerPermission>(PermissionNamespace.CUSTOMER, 'view');
    this.leads = this.createResourceDomain<LeadPermission>(PermissionNamespace.LEAD, 'view');
    this.leadStages = this.createResourceDomain<LeadStagePermission>(PermissionNamespace.LEAD_STAGE, 'view');
    this.chatConversations = this.createResourceDomain<ChatConversationPermission>(PermissionNamespace.CHAT_CONVERSATION, 'view');
    this.chatMessages = this.createResourceDomain<ChatMessagePermission>(PermissionNamespace.CHAT_MESSAGE, 'view');
    this.chatMessageRequests = this.createResourceDomain<ChatMessageRequestPermission>(PermissionNamespace.CHAT_MESSAGE_REQUEST, 'view');
    this.places = this.createResourceDomain<PlacePermission>(PermissionNamespace.PLACE, 'view');
    this.notes = this.createResourceDomain<NotePermission>(PermissionNamespace.NOTE, 'view');
  }

  resource<TPermission extends string = string>(
    namespace: PermissionNamespace | string,
    options?: { defaultListPermission?: TPermission | string }
  ): ResourcePermissions<TPermission> {
    return new ResourcePermissions<TPermission>(this.client, namespace, options);
  }

  /** Platform-level operations */
  readonly platform = {
    hasRole: (userId: string | undefined | null, role: PlatformRole) => 
      platform.hasRole(this.client, userId, role),
    requireRole: (userId: string | undefined | null, role: PlatformRole) => 
      platform.requireRole(this.client, userId, role),
    hasAdmin: (userId: string | undefined | null) => platform.hasAdmin(this.client, userId),
    hasSupport: (userId: string | undefined | null) => platform.hasSupport(this.client, userId),
    requireAdmin: (userId: string | undefined | null) => platform.requireAdmin(this.client, userId),
    requireSupport: (userId: string | undefined | null) => platform.requireSupport(this.client, userId),
    grantRole: (userId: string, role: PlatformRole) => 
      platform.grantRole(this.client, userId, role),
    revokeRole: (userId: string, role: PlatformRole) => 
      platform.revokeRole(this.client, userId, role),
  };

  /** Workspace-level operations */
  readonly workspace = {
    hasRole: (workspaceId: string, userId: string, role: WorkspaceRole) =>
      workspace.hasRole(this.client, workspaceId, userId, role),
    requireRole: (workspaceId: string, userId: string, role: WorkspaceRole) =>
      workspace.requireRole(this.client, workspaceId, userId, role),
    hasPermission: (workspaceId: string, userId: string, permission: WorkspacePermission | string) =>
      workspace.hasPermission(this.client, workspaceId, userId, permission),
    requirePermission: (workspaceId: string, userId: string, permission: WorkspacePermission | string) =>
      workspace.requirePermission(this.client, workspaceId, userId, permission),
    listWorkspaces: (userId: string, permission?: WorkspacePermission | string) =>
      workspace.listWorkspaces(this.client, userId, permission),
    grantRole: (workspaceId: string, userId: string, role: WorkspaceRole) =>
      workspace.grantRole(this.client, workspaceId, userId, role),
    revokeRole: (workspaceId: string, userId: string, role: WorkspaceRole) =>
      workspace.revokeRole(this.client, workspaceId, userId, role),
    revokeAllRoles: (workspaceId: string, userId: string) =>
      workspace.revokeAllRoles(this.client, workspaceId, userId),
  };

  /** Reset circuit breaker for specific endpoint */
  resetCircuitBreaker(endpoint: 'read' | 'write'): void {
    resetCircuitBreaker(`permissions-${endpoint}`);
  }
}
