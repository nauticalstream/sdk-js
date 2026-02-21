/**
 * Ory Permission Language (OPL) Namespace Configuration
 * 
 * This file defines the permission model for the entire system using a subset of TypeScript.
 * It follows Google's Zanzibar model for relationship-based access control.
 */

export const OPL_NAMESPACE_CONFIG = `
// User namespace - represents system users (subjects)
class User {}

// Platform namespace - system-wide permissions
class Platform {
  related = {
    admins: User[],
    support: User[],
  }

  permits = {
    admin: (ctx: Context): boolean =>
      this.related.admins.includes(ctx.subject),
    
    support: (ctx: Context): boolean =>
      this.related.support.includes(ctx.subject) ||
      this.permits.admin(ctx),
  }
}

// Workspace namespace - organization/team level permissions
class Workspace {
  related = {
    owners: User[],
    admins: User[],
    members: User[],
    viewers: User[],
  }

  permits = {
    view: (ctx: Context): boolean =>
      this.related.viewers.includes(ctx.subject) ||
      this.permits.member(ctx),
    
    member: (ctx: Context): boolean =>
      this.related.members.includes(ctx.subject) ||
      this.permits.admin(ctx),
    
    admin: (ctx: Context): boolean =>
      this.related.admins.includes(ctx.subject) ||
      this.permits.owner(ctx),
    
    owner: (ctx: Context): boolean =>
      this.related.owners.includes(ctx.subject),
    
    invite_member: (ctx: Context): boolean =>
      this.permits.admin(ctx),
    
    remove_member: (ctx: Context): boolean =>
      this.permits.admin(ctx),
    
    update_settings: (ctx: Context): boolean =>
      this.permits.admin(ctx),
    
    delete: (ctx: Context): boolean =>
      this.permits.owner(ctx),
  }
}

// Post namespace - example resource with workspace inheritance
class Post {
  related = {
    owners: User[],
    editors: User[],
    viewers: User[],
    workspaces: Workspace[],
  }

  permits = {
    view: (ctx: Context): boolean =>
      this.related.viewers.includes(ctx.subject) ||
      this.permits.edit(ctx) ||
      this.related.workspaces.traverse((ws) => ws.permits.view(ctx)),
    
    edit: (ctx: Context): boolean =>
      this.related.editors.includes(ctx.subject) ||
      this.permits.delete(ctx),
    
    delete: (ctx: Context): boolean =>
      this.related.owners.includes(ctx.subject) ||
      this.related.workspaces.traverse((ws) => ws.permits.admin(ctx)),
    
    share: (ctx: Context): boolean =>
      this.permits.delete(ctx),
  }
}

// File namespace - file storage with workspace inheritance
class File {
  related = {
    owners: User[],
    editors: User[],
    viewers: User[],
    workspaces: Workspace[],
  }

  permits = {
    view: (ctx: Context): boolean =>
      this.related.viewers.includes(ctx.subject) ||
      this.permits.edit(ctx) ||
      this.related.workspaces.traverse((ws) => ws.permits.view(ctx)),
    
    edit: (ctx: Context): boolean =>
      this.related.editors.includes(ctx.subject) ||
      this.permits.delete(ctx),
    
    delete: (ctx: Context): boolean =>
      this.related.owners.includes(ctx.subject) ||
      this.related.workspaces.traverse((ws) => ws.permits.admin(ctx)),
    
    share: (ctx: Context): boolean =>
      this.permits.delete(ctx),
  }
}

// Document namespace - documents with workspace inheritance
class Document {
  related = {
    owners: User[],
    editors: User[],
    viewers: User[],
    workspaces: Workspace[],
  }

  permits = {
    view: (ctx: Context): boolean =>
      this.related.viewers.includes(ctx.subject) ||
      this.permits.edit(ctx) ||
      this.related.workspaces.traverse((ws) => ws.permits.view(ctx)),
    
    edit: (ctx: Context): boolean =>
      this.related.editors.includes(ctx.subject) ||
      this.permits.delete(ctx),
    
    delete: (ctx: Context): boolean =>
      this.related.owners.includes(ctx.subject) ||
      this.related.workspaces.traverse((ws) => ws.permits.admin(ctx)),
    
    share: (ctx: Context): boolean =>
      this.permits.delete(ctx),
  }
}
`;
