import 'reflect-metadata';
import { describe, it, expect } from 'vitest';
import { Workspace } from '../../../src/domain/entities/Workspace.ts';

describe('Workspace entity basic test', () => {
  it('should create a Workspace instance with given properties', () => {
    const workspaceKey = '11111111-1111-1111-1111-111111111111';
    const createdBy = '22222222-2222-2222-2222-222222222222';
    const name = 'My Workspace';

    const workspace = new Workspace(workspaceKey, name, createdBy);

    expect(workspace.workspaceKey).toBe(workspaceKey);
    expect(workspace.name).toBe(name);
    expect(workspace.createdBy).toBe(createdBy);
  });

  it('should add a user ID to userIds array only if not already present', () => {
    const workspace = new Workspace('key', 'name', 'creator');
    expect(workspace.userIds).toEqual([]);
    workspace.addUser('user-uuid-1');
    expect(workspace.userIds).toEqual(['user-uuid-1']);
    workspace.addUser('user-uuid-1');
    expect(workspace.userIds).toEqual(['user-uuid-1']);
    workspace.addUser('user-uuid-2');
    expect(workspace.userIds).toEqual(['user-uuid-1', 'user-uuid-2']);
  });
});
