import { describe, expect, it, vi } from 'vitest';
import { PermissionNamespace, PostPermission } from '../domains/resource.js';
import { WorkspacePermission, WorkspaceRole } from '../domains/workspace.js';
import * as workspace from '../core/workspace.js';
import * as resource from '../core/resource.js';

describe('Permission mappings', () => {
  it('maps new workspace-scoped permissions to schema names', async () => {
    const client = {
      permission: {
        checkPermission: vi.fn().mockResolvedValue({ data: { allowed: true } }),
      },
    } as any;

    await workspace.hasPermission(
      client,
      'ws-1',
      'user-1',
      WorkspacePermission.MANAGE_WORKSPACE_CATEGORIES
    );

    expect(client.permission.checkPermission).toHaveBeenCalledWith({
      namespace: 'workspace',
      object: 'ws-1',
      relation: 'manage_workspace_categories',
      subjectId: 'user-1',
    });
  });

  it('lists workspaces via lookupResources using workspace permission names', async () => {
    const client = {
      lookupResources: vi.fn().mockResolvedValue(['ws-1', 'ws-2']),
    } as any;

    const result = await workspace.listWorkspaces(client, 'user-1', WorkspacePermission.ADMIN);

    expect(result).toEqual(['ws-1', 'ws-2']);
    expect(client.lookupResources).toHaveBeenCalledWith({
      namespace: 'workspace',
      permission: 'admin',
      subjectId: 'user-1',
    });
  });

  it('grants workspace roles using singular relations', async () => {
    const client = {
      relationship: {
        createRelationship: vi.fn().mockResolvedValue(undefined),
      },
    } as any;

    await workspace.grantRole(client, 'ws-1', 'user-1', WorkspaceRole.MEMBER);

    expect(client.relationship.createRelationship).toHaveBeenCalledWith({
      createRelationshipBody: {
        namespace: 'workspace',
        object: 'ws-1',
        relation: 'member_role',
        subject_id: 'user-1',
      },
    });
  });

  it('links resources to the singular workspace relation', async () => {
    const client = {
      relationship: {
        createRelationship: vi.fn().mockResolvedValue(undefined),
      },
    } as any;

    await resource.linkToWorkspace(client, PermissionNamespace.POST, 'post-1', 'ws-1');

    expect(client.relationship.createRelationship).toHaveBeenCalledWith({
      createRelationshipBody: {
        namespace: 'post',
        object: 'post-1',
        relation: 'workspace',
        subject_set: {
          namespace: 'workspace',
          object: 'ws-1',
          relation: '',
        },
      },
    });
  });

  it('lists resources via lookupResources using lowercase namespaces', async () => {
    const client = {
      lookupResources: vi.fn().mockResolvedValue(['post-1']),
    } as any;

    const result = await resource.listResources(client, PermissionNamespace.POST, 'user-1', PostPermission.VIEW);

    expect(result).toEqual(['post-1']);
    expect(client.lookupResources).toHaveBeenCalledWith({
      namespace: 'post',
      permission: 'view',
      subjectId: 'user-1',
    });
  });

  it('maps new permission namespaces to lowercase schema resource names', async () => {
    const client = {
      lookupResources: vi.fn().mockResolvedValue(['category-1']),
    } as any;

    const result = await resource.listResources(
      client,
      PermissionNamespace.WORKSPACE_CATEGORY,
      'user-1',
      'view'
    );

    expect(result).toEqual(['category-1']);
    expect(client.lookupResources).toHaveBeenCalledWith({
      namespace: 'workspace_category',
      permission: 'view',
      subjectId: 'user-1',
    });
  });

  it('maps event, tour, and cruise namespaces to lowercase schema resource names', async () => {
    const client = {
      lookupResources: vi.fn().mockResolvedValue(['event-1', 'tour-1', 'cruise-1']),
    } as any;

    await resource.listResources(client, PermissionNamespace.EVENT, 'user-1', 'view');
    await resource.listResources(client, PermissionNamespace.TOUR, 'user-1', 'view');
    await resource.listResources(client, PermissionNamespace.CRUISE, 'user-1', 'view');

    expect(client.lookupResources).toHaveBeenNthCalledWith(1, {
      namespace: 'event',
      permission: 'view',
      subjectId: 'user-1',
    });
    expect(client.lookupResources).toHaveBeenNthCalledWith(2, {
      namespace: 'tour',
      permission: 'view',
      subjectId: 'user-1',
    });
    expect(client.lookupResources).toHaveBeenNthCalledWith(3, {
      namespace: 'cruise',
      permission: 'view',
      subjectId: 'user-1',
    });
  });

  it('maps newly approved standalone resource namespaces to lowercase schema resource names', async () => {
    const client = {
      lookupResources: vi.fn().mockResolvedValue(['resource-1']),
    } as any;

    await resource.listResources(client, PermissionNamespace.ARTICLE_TOPIC, 'user-1', 'view');
    await resource.listResources(client, PermissionNamespace.EVENT_TICKET_SPECIFICATION, 'user-1', 'view');
    await resource.listResources(client, PermissionNamespace.CHAT_MESSAGE_REQUEST, 'user-1', 'view');

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
  });

  it('maps additional service resource namespaces to lowercase schema resource names', async () => {
    const client = {
      lookupResources: vi.fn().mockResolvedValue(['resource-1']),
    } as any;

    await resource.listResources(client, PermissionNamespace.BOAT, 'user-1', 'view');
    await resource.listResources(client, PermissionNamespace.ITINERARY, 'user-1', 'view');
    await resource.listResources(client, PermissionNamespace.STREAM, 'user-1', 'view');
    await resource.listResources(client, PermissionNamespace.BUSINESS, 'user-1', 'view');
    await resource.listResources(client, PermissionNamespace.CATALOG_PRODUCT, 'user-1', 'view');
    await resource.listResources(client, PermissionNamespace.PRICE_CONFIGURATION, 'user-1', 'view');
    await resource.listResources(client, PermissionNamespace.CONNECTED_EMAIL_ACCOUNT, 'user-1', 'view');
    await resource.listResources(client, PermissionNamespace.VERIFICATION_SESSION, 'user-1', 'view');

    expect(client.lookupResources).toHaveBeenNthCalledWith(1, {
      namespace: 'boat',
      permission: 'view',
      subjectId: 'user-1',
    });
    expect(client.lookupResources).toHaveBeenNthCalledWith(2, {
      namespace: 'itinerary',
      permission: 'view',
      subjectId: 'user-1',
    });
    expect(client.lookupResources).toHaveBeenNthCalledWith(3, {
      namespace: 'stream',
      permission: 'view',
      subjectId: 'user-1',
    });
    expect(client.lookupResources).toHaveBeenNthCalledWith(4, {
      namespace: 'business',
      permission: 'view',
      subjectId: 'user-1',
    });
    expect(client.lookupResources).toHaveBeenNthCalledWith(5, {
      namespace: 'catalog_product',
      permission: 'view',
      subjectId: 'user-1',
    });
    expect(client.lookupResources).toHaveBeenNthCalledWith(6, {
      namespace: 'price_configuration',
      permission: 'view',
      subjectId: 'user-1',
    });
    expect(client.lookupResources).toHaveBeenNthCalledWith(7, {
      namespace: 'connected_email_account',
      permission: 'view',
      subjectId: 'user-1',
    });
    expect(client.lookupResources).toHaveBeenNthCalledWith(8, {
      namespace: 'verification_session',
      permission: 'view',
      subjectId: 'user-1',
    });
  });
});