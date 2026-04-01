import { describe, expect, it, vi } from 'vitest';
import { Permissions } from '../core/permissions.js';
import { PostPermission, PostsPermissions, ResourcePermissions } from '../domains/resource.js';

function getPermissionsClient(permissions: Permissions): any {
  return (permissions as any).client;
}

describe('Resource permission domains', () => {
  it('supports generic schema resources without creating a new wrapper class', async () => {
    const client = {
      lookupResources: vi.fn().mockResolvedValue(['comment-1']),
    } as any;

    const comments = new ResourcePermissions<'view' | 'edit'>(client, 'comment', {
      defaultListPermission: 'view',
    });

    const result = await comments.list('user-1');

    expect(result).toEqual(['comment-1']);
    expect(client.lookupResources).toHaveBeenCalledWith({
      namespace: 'comment',
      permission: 'view',
      subjectId: 'user-1',
    });
  });

  it('keeps existing typed wrappers as compatibility layers', async () => {
    const client = {
      lookupResources: vi.fn().mockResolvedValue(['post-1']),
    } as any;

    const posts = new PostsPermissions(client);
    const result = await posts.list('user-1');

    expect(result).toEqual(['post-1']);
    expect(client.lookupResources).toHaveBeenCalledWith({
      namespace: 'post',
      permission: 'view',
      subjectId: 'user-1',
    });
  });

  it('exposes a generic resource factory on Permissions', () => {
    const permissions = new Permissions({
      endpoint: 'localhost:50051',
      insecure: true,
    });

    const comments = permissions.resource<'view' | 'edit'>('comment', {
      defaultListPermission: 'view',
    });

    expect(comments).toBeInstanceOf(ResourcePermissions);
  });

  it('exposes first-class domains for schema resources without dedicated wrapper files', async () => {
    const permissions = new Permissions({
      endpoint: 'localhost:50051',
      insecure: true,
    });
    const client = getPermissionsClient(permissions);

    client.lookupResources = vi.fn().mockResolvedValue(['lead-1']);

    const result = await permissions.leads.list('user-1');

    expect(result).toEqual(['lead-1']);
    expect(client.lookupResources).toHaveBeenCalledWith({
      namespace: 'lead',
      permission: 'view',
      subjectId: 'user-1',
    });
  });

  it('exposes first-class domains for workspace taxonomy resources', async () => {
    const permissions = new Permissions({
      endpoint: 'localhost:50051',
      insecure: true,
    });
    const client = getPermissionsClient(permissions);

    client.lookupResources = vi.fn().mockResolvedValue(['category-1']);

    const result = await permissions.workspaceCategories.list('user-1');

    expect(result).toEqual(['category-1']);
    expect(client.lookupResources).toHaveBeenCalledWith({
      namespace: 'workspace_category',
      permission: 'view',
      subjectId: 'user-1',
    });
  });

  it('exposes first-class domains for newly approved standalone resources', async () => {
    const permissions = new Permissions({
      endpoint: 'localhost:50051',
      insecure: true,
    });
    const client = getPermissionsClient(permissions);

    client.lookupResources = vi
      .fn()
      .mockResolvedValueOnce(['topic-1'])
      .mockResolvedValueOnce(['ticket-spec-1'])
      .mockResolvedValueOnce(['message-request-1']);
    client.checkPermission = vi.fn().mockResolvedValue({ data: { allowed: true } });

    await permissions.articleTopics.list('user-1');
    await permissions.eventTicketSpecifications.list('user-1');
    await permissions.chatMessageRequests.list('user-1');
    await permissions.chatMessageRequests.hasPermission('message-request-1', 'user-1', 'assign');

    expect(client.lookupResources).toHaveBeenNthCalledWith(1, {
      namespace: 'article_topic',
      permission: 'view',
      subjectId: 'user-1',
    });
    expect(client.lookupResources).toHaveBeenNthCalledWith(2, {
      namespace: 'event_ticket_specification',
      permission: 'view',
      subjectId: 'user-1',
    });
    expect(client.lookupResources).toHaveBeenNthCalledWith(3, {
      namespace: 'chat_message_request',
      permission: 'view',
      subjectId: 'user-1',
    });
    expect(client.checkPermission).toHaveBeenCalledWith({
      namespace: 'chat_message_request',
      object: 'message-request-1',
      relation: 'assign',
      subjectId: 'user-1',
    });
  });

  it('exposes first-class domains for event, tour, and cruise resources', async () => {
    const permissions = new Permissions({
      endpoint: 'localhost:50051',
      insecure: true,
    });
    const client = getPermissionsClient(permissions);

    client.lookupResources = vi.fn().mockResolvedValue(['event-1']);
    client.checkPermission = vi.fn().mockResolvedValue({ data: { allowed: true } });

    const result = await permissions.events.list('user-1');
    await permissions.tours.hasPermission('tour-1', 'user-1', 'publish');
    await permissions.cruises.hasPermission('cruise-1', 'user-1', 'edit');

    expect(result).toEqual(['event-1']);
    expect(client.lookupResources).toHaveBeenCalledWith({
      namespace: 'event',
      permission: 'view',
      subjectId: 'user-1',
    });
    expect(client.checkPermission).toHaveBeenNthCalledWith(1, {
      namespace: 'tour',
      object: 'tour-1',
      relation: 'publish',
      subjectId: 'user-1',
    });
    expect(client.checkPermission).toHaveBeenNthCalledWith(2, {
      namespace: 'cruise',
      object: 'cruise-1',
      relation: 'edit',
      subjectId: 'user-1',
    });
  });

  it('exposes first-class domains for the remaining service-backed resources', async () => {
    const permissions = new Permissions({
      endpoint: 'localhost:50051',
      insecure: true,
    });
    const client = getPermissionsClient(permissions);

    client.lookupResources = vi.fn().mockResolvedValue(['boat-1']);
    client.checkPermission = vi.fn().mockResolvedValue({ data: { allowed: true } });

    const result = await permissions.boats.list('user-1');
    await permissions.businesses.hasPermission('business-1', 'user-1', 'verify');
    await permissions.connectedEmailAccounts.hasPermission('account-1', 'user-1', 'send');
    await permissions.verificationSessions.hasPermission('session-1', 'user-1', 'cancel');

    expect(result).toEqual(['boat-1']);
    expect(client.lookupResources).toHaveBeenCalledWith({
      namespace: 'boat',
      permission: 'view',
      subjectId: 'user-1',
    });
    expect(client.checkPermission).toHaveBeenNthCalledWith(1, {
      namespace: 'business',
      object: 'business-1',
      relation: 'verify',
      subjectId: 'user-1',
    });
    expect(client.checkPermission).toHaveBeenNthCalledWith(2, {
      namespace: 'connected_email_account',
      object: 'account-1',
      relation: 'send',
      subjectId: 'user-1',
    });
    expect(client.checkPermission).toHaveBeenNthCalledWith(3, {
      namespace: 'verification_session',
      object: 'session-1',
      relation: 'cancel',
      subjectId: 'user-1',
    });
  });

  it('exposes a first-class domain for storage collections', async () => {
    const permissions = new Permissions({
      endpoint: 'localhost:50051',
      insecure: true,
    });
    const client = getPermissionsClient(permissions);

    client.lookupResources = vi.fn().mockResolvedValue(['gallery-1']);
    client.checkPermission = vi.fn().mockResolvedValue({ data: { allowed: true } });

    const result = await permissions.storageCollections.list('user-1');
    await permissions.storageCollections.hasPermission('gallery-1', 'user-1', 'add_items');

    expect(result).toEqual(['gallery-1']);
    expect(client.lookupResources).toHaveBeenCalledWith({
      namespace: 'storage_collection',
      permission: 'view',
      subjectId: 'user-1',
    });
    expect(client.checkPermission).toHaveBeenCalledWith({
      namespace: 'storage_collection',
      object: 'gallery-1',
      relation: 'add_items',
      subjectId: 'user-1',
    });
  });

  it('uses schema-specific permission names on first-class generic domains', async () => {
    const permissions = new Permissions({
      endpoint: 'localhost:50051',
      insecure: true,
    });

    const client = (permissions as any).client;
    client.checkPermission = vi.fn().mockResolvedValue({
      data: { allowed: true },
    });

    await permissions.comments.hasPermission('comment-1', 'user-1', 'reply');

    expect(client.checkPermission).toHaveBeenCalledWith({
      namespace: 'comment',
      object: 'comment-1',
      relation: 'reply',
      subjectId: 'user-1',
    });
  });

  it('allows callers to override the default list permission', async () => {
    const client = {
      lookupResources: vi.fn().mockResolvedValue(['post-2']),
    } as any;

    const posts = new PostsPermissions(client);
    await posts.list('user-1', PostPermission.EDIT);

    expect(client.lookupResources).toHaveBeenCalledWith({
      namespace: 'post',
      permission: 'edit',
      subjectId: 'user-1',
    });
  });
});