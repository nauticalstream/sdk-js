import { describe, it, expect } from 'vitest';
import { chatTopics, platformTopics, presenceTopics, notificationTopics, workspaceTopics, TOPICS } from '../topics/index.js';

describe('chatTopics', () => {
  it('conversation(id) returns conv/{id}', () => {
    expect(chatTopics.conversation('c456')).toBe('conv/c456');
  });

  it('commands.sendMessage(userId) returns commands/chat/user/{userId}/send', () => {
    expect(chatTopics.commands.sendMessage('u123')).toBe('commands/chat/user/u123/send');
  });

  it('commands.markRead(userId) returns commands/chat/user/{userId}/read', () => {
    expect(chatTopics.commands.markRead('u123')).toBe('commands/chat/user/u123/read');
  });

  it('commands.markDelivered(userId) returns commands/chat/user/{userId}/delivered', () => {
    expect(chatTopics.commands.markDelivered('u123')).toBe('commands/chat/user/u123/delivered');
  });

  it('commands.typing(userId) returns commands/chat/user/{userId}/typing', () => {
    expect(chatTopics.commands.typing('u123')).toBe('commands/chat/user/u123/typing');
  });
});

describe('platformTopics', () => {
  it('user(userId) returns user/{userId}', () => {
    expect(platformTopics.user('u123')).toBe('user/u123');
  });
});

describe('presenceTopics', () => {
  it('user(userId) returns presence/{userId}', () => {
    expect(presenceTopics.user('u789')).toBe('presence/u789');
  });

  it('workspace(workspaceId) returns presence/workspace/{id}', () => {
    expect(presenceTopics.workspace('ws1')).toBe('presence/workspace/ws1');
  });
});

describe('notificationTopics', () => {
  it('user(userId) returns notification/{userId}', () => {
    expect(notificationTopics.user('u1')).toBe('notification/u1');
  });

  it('workspace(workspaceId) returns notification/workspace/{id}', () => {
    expect(notificationTopics.workspace('ws2')).toBe('notification/workspace/ws2');
  });
});

describe('workspaceTopics', () => {
  it('updates(workspaceId) returns workspace/{id}/updates', () => {
    expect(workspaceTopics.updates('ws3')).toBe('workspace/ws3/updates');
  });

  it('members(workspaceId) returns workspace/{id}/members', () => {
    expect(workspaceTopics.members('ws3')).toBe('workspace/ws3/members');
  });
});

describe('TOPICS (barrel)', () => {
  it('TOPICS.CHAT is chatTopics', () => {
    expect(TOPICS.CHAT).toBe(chatTopics);
  });

  it('TOPICS.PLATFORM is platformTopics', () => {
    expect(TOPICS.PLATFORM).toBe(platformTopics);
  });

  it('TOPICS.PRESENCE is presenceTopics', () => {
    expect(TOPICS.PRESENCE).toBe(presenceTopics);
  });

  it('TOPICS.NOTIFICATION is notificationTopics', () => {
    expect(TOPICS.NOTIFICATION).toBe(notificationTopics);
  });

  it('TOPICS.WORKSPACE is workspaceTopics', () => {
    expect(TOPICS.WORKSPACE).toBe(workspaceTopics);
  });

  it('TOPICS.PLATFORM.user(userId) produces correct topic through barrel', () => {
    expect(TOPICS.PLATFORM.user('test')).toBe('user/test');
  });
});
