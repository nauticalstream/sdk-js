import { describe, it, expect } from 'vitest';
import { chatTopics, presenceTopics, notificationTopics, workspaceTopics, TOPICS } from '../topics';

describe('chatTopics', () => {
  it('user(userId) returns user/{userId}', () => {
    expect(chatTopics.user('u123')).toBe('user/u123');
  });

  it('conversation(id) returns conv/{id}', () => {
    expect(chatTopics.conversation('c456')).toBe('conv/c456');
  });

  it('commands.sendMessage() returns commands/chat/send', () => {
    expect(chatTopics.commands.sendMessage()).toBe('commands/chat/send');
  });

  it('commands.markRead() returns commands/chat/read', () => {
    expect(chatTopics.commands.markRead()).toBe('commands/chat/read');
  });

  it('commands.typing() returns commands/chat/typing', () => {
    expect(chatTopics.commands.typing()).toBe('commands/chat/typing');
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

  it('TOPICS.PRESENCE is presenceTopics', () => {
    expect(TOPICS.PRESENCE).toBe(presenceTopics);
  });

  it('TOPICS.NOTIFICATION is notificationTopics', () => {
    expect(TOPICS.NOTIFICATION).toBe(notificationTopics);
  });

  it('TOPICS.WORKSPACE is workspaceTopics', () => {
    expect(TOPICS.WORKSPACE).toBe(workspaceTopics);
  });

  it('TOPICS.CHAT.user produces correct topic through barrel', () => {
    expect(TOPICS.CHAT.user('test')).toBe('user/test');
  });
});
