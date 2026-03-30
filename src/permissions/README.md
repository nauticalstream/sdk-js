# Permissions

Permission checks and grants across three namespaces: **platform** (global admin/moderator roles), **workspace** (owner/admin/member roles), **resource** (per-object view/edit/delete/manage).

See [RESOURCE_MODEL.md](./RESOURCE_MODEL.md) for the current rule set on when a service domain should be modeled as a standalone permission resource, when it should inherit from a parent resource, and when workspace or platform scope is enough.

---

## Setup

```typescript
import { Permissions } from "@nauticalstream/sdk/permissions";

const permissions = new Permissions({
  endpoint: process.env.PERMISSIONS_ENDPOINT ?? "localhost:50051",
});
```

---

## Platform permissions

```typescript
import { PlatformRole } from "@nauticalstream/sdk/permissions";

const isAdmin = await permissions.platform.hasAdmin(userId);
const isSupport = await permissions.platform.hasSupport(userId);

await permissions.platform.grantRole(userId, PlatformRole.ADMIN);
await permissions.platform.revokeRole(userId, PlatformRole.ADMIN);
```

---

## Workspace permissions

```typescript
import {
  WorkspaceRole,
  WorkspacePermission,
} from "@nauticalstream/sdk/permissions";

const canView = await permissions.workspace.hasPermission(
  workspaceId,
  userId,
  WorkspacePermission.VIEW,
);

await permissions.workspace.grantRole(workspaceId, userId, WorkspaceRole.OWNER);
await permissions.workspace.revokeRole(
  workspaceId,
  userId,
  WorkspaceRole.MEMBER,
);
```

---

## Resource permissions

```typescript
import {
  PermissionNamespace,
  PostPermission,
} from "@nauticalstream/sdk/permissions";

const canView = await permissions.posts.hasPermission(
  postId,
  userId,
  PostPermission.VIEW,
);

await permissions.posts.grantPermission(postId, userId, PostPermission.EDIT);
await permissions.posts.linkToWorkspace(postId, workspaceId);

const resourceCanView = await permissions.posts.hasPermission(
  postId,
  userId,
  PostPermission.VIEW,
);

const directCheck = await permissions.posts.hasPermission(
  postId,
  userId,
  PostPermission.VIEW,
);

const genericNamespace = PermissionNamespace.POST;
```

For cross-service resources, prefer the explicit domain names exposed by the SDK, for example `permissions.leadStages`, `permissions.chatConversations`, `permissions.chatMessages`, `permissions.articleTopics`, `permissions.eventTicketSpecifications`, and `permissions.chatMessageRequests`.
