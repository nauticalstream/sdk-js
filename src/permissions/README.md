# Permissions

Ory Keto-backed permission checks and grants. Three namespaces: **platform** (global admin/moderator roles), **workspace** (owner/admin/member roles), **resource** (per-object view/edit/delete/manage).

---

## Setup

```typescript
import { Permissions } from '@nauticalstream/sdk/permissions';

const permissions = new Permissions({
  url: process.env.KETO_URL ?? 'http://localhost:4467',
});

// Bootstrap namespace config once at startup
await permissions.bootstrap();
```

---

## Platform permissions

```typescript
const isAdmin = await permissions.platform.hasAdmin(userId);
const isMod   = await permissions.platform.hasModerator(userId);

await permissions.platform.grantRole(userId, PlatformRole.ADMIN);
await permissions.platform.revokeRole(userId, PlatformRole.ADMIN);
```

---

## Workspace permissions

```typescript
import { WorkspaceRole } from '@nauticalstream/sdk/permissions';

const canEdit = await permissions.workspace.hasPermission(workspaceId, userId, 'edit');
const role    = await permissions.workspace.getRole(workspaceId, userId);

await permissions.workspace.grantRole(workspaceId, userId, WorkspaceRole.OWNER);
await permissions.workspace.revokeRole(workspaceId, userId, WorkspaceRole.MEMBER);
```

---

## Resource permissions

```typescript
import { ResourcePermission } from '@nauticalstream/sdk/permissions';

const canView = await permissions.resource.hasPermission('Post', postId, userId, 'view');

await permissions.resource.grant('Post', postId, userId, ResourcePermission.EDIT);
await permissions.resource.linkToWorkspace('Post', postId, workspaceId);
```

---

## Health check

```typescript
import { checkHealth } from '@nauticalstream/sdk/permissions';

const status = await checkHealth(permissions);
// { status: 'ok' | 'degraded' | 'down', latencyMs: number }
```
