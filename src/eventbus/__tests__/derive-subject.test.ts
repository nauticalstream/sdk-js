import { describe, it, expect } from 'vitest';
import { deriveSubject } from '../utils/derive-subject';

describe('deriveSubject', () => {
  describe('standard conversions', () => {
    it('converts a simple PascalCase message name to kebab-case', () => {
      expect(deriveSubject('user.v1.GetUserRequest')).toBe('user.v1.get-user-request');
    });

    it('converts a compound message with multiple capital runs', () => {
      expect(deriveSubject('workspace.v1.WorkspaceCreated')).toBe('workspace.v1.workspace-created');
    });

    it('converts a long compound message name', () => {
      expect(deriveSubject('chat.v1.ConversationParticipantAdded')).toBe('chat.v1.conversation-participant-added');
    });

    it('preserves the package segment as-is', () => {
      expect(deriveSubject('nauticalstream.v2.UserLoggedIn')).toBe('nauticalstream.v2.user-logged-in');
    });

    it('handles a single-word message name (no hyphens inserted)', () => {
      expect(deriveSubject('events.v1.Created')).toBe('events.v1.created');
    });

    it('preserves dots in the package.version prefix', () => {
      const result = deriveSubject('a.b.SomeEvent');
      expect(result.startsWith('a.b.')).toBe(true);
    });
  });

  describe('error cases', () => {
    it('throws when typeName is undefined', () => {
      expect(() => deriveSubject(undefined)).toThrow('Schema typeName is required');
    });

    it('throws when typeName is an empty string', () => {
      expect(() => deriveSubject('')).toThrow('Schema typeName is required');
    });

    it('throws when typeName has fewer than 3 dot-separated parts', () => {
      expect(() => deriveSubject('user.GetRequest')).toThrow('Invalid protobuf typeName');
    });

    it('includes the bad typeName in the error message', () => {
      expect(() => deriveSubject('bad')).toThrow('"bad"');
    });
  });
});
