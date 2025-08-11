import 'reflect-metadata';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Workspace } from '../../../../src/domain/entities/Workspace.js';
import { WorkspaceRepository } from '../../../../src/application/infrastructure/database/WorkspaceRepository.ts';

describe('WorkspaceRepository (inherited BaseRepository methods + new methods)', () => {
  let prismaMock: any;
  let repo: WorkspaceRepository;

  beforeEach(() => {
    prismaMock = {
      workspace: {
        create: vi.fn(),
        findFirst: vi.fn(),
        findMany: vi.fn(),
        findUnique: vi.fn(),
        update: vi.fn(),
      },
    };
    repo = new WorkspaceRepository(prismaMock);
  });

  it('create() should call prisma.workspace.create and return mapped entity', async () => {
    const entity = new Workspace('key-1', 'Test WS', 'user-uuid');
    prismaMock.workspace.create.mockResolvedValue({
      uuid: 'uuid-1',
      workspace_key: 'key-1',
      name: 'Test WS',
      created_by: 'user-uuid',
      active: true,
      created_at: new Date(),
      updated_at: new Date(),
      deleted_at: null,
    });

    const result = await repo.create(entity);

    expect(prismaMock.workspace.create).toHaveBeenCalledWith({
      data: entity.toJson()
    });
    expect(result).toBeInstanceOf(Workspace);
    expect(result.uuid).toBe('uuid-1');
  });

  it('findByUuid() should throw NotFoundError if entity is not found', async () => {
    prismaMock.workspace.findFirst.mockResolvedValue(null);
  
    await expect(repo.findByUuid('not-found-uuid')).rejects.toMatchObject({
      name: 'NotFoundError',
      message: 'The entity not-found-uuid was not found',
    });
    await expect(repo.findByUuid('not-found-uuid')).rejects.toThrow('The entity not-found-uuid was not found');
  
    expect(prismaMock.workspace.findFirst).toHaveBeenCalledWith({
      where: { uuid: 'not-found-uuid', active: true }
    });
  });

  it('findAll() should return all active workspaces mapped to entities', async () => {
    prismaMock.workspace.findMany.mockResolvedValue([
      {
        uuid: 'uuid-3',
        workspace_key: 'key-3',
        name: 'WS3',
        created_by: 'user-uuid',
        active: true,
        created_at: new Date(),
        updated_at: new Date(),
        deleted_at: null,
      }
    ]);

    const results = await repo.findAll();
    expect(prismaMock.workspace.findMany).toHaveBeenCalledWith({
      where: { active: true }
    });
    expect(results.length).toBe(1);
    expect(results[0]).toBeInstanceOf(Workspace);
  });

  it('update() should call prisma.workspace.update and return mapped entity', async () => {
    prismaMock.workspace.update.mockResolvedValue({
      uuid: 'uuid-4',
      workspace_key: 'key-4',
      name: 'Updated WS',
      created_by: 'user-uuid',
      active: true,
      created_at: new Date(),
      updated_at: new Date(),
      deleted_at: null,
    });

    const partialEntity = new Workspace('key-4', 'Updated WS', 'user-uuid');
    const result = await repo.update('uuid-4', partialEntity);

    expect(prismaMock.workspace.update).toHaveBeenCalledWith({
      where: { uuid: 'uuid-4' },
      data: partialEntity.toJson()
    });
    expect(result).toBeInstanceOf(Workspace);
    expect(result.name).toBe('Updated WS');
  });

  it('findByCreatedBy() should return an array of Workspaces for given creator', async () => {
    const dbRecords = [
      {
        uuid: 'uuid-1',
        workspace_key: 'key-1',
        name: 'Workspace 1',
        created_by: 'creator-uuid',
        active: true,
        created_at: new Date(),
        updated_at: new Date(),
        deleted_at: null,
      },
      {
        uuid: 'uuid-2',
        workspace_key: 'key-2',
        name: 'Workspace 2',
        created_by: 'creator-uuid',
        active: true,
        created_at: new Date(),
        updated_at: new Date(),
        deleted_at: null,
      },
    ];
    prismaMock.workspace.findMany.mockResolvedValue(dbRecords);

    const results = await repo.findByCreatedBy('creator-uuid');

    expect(prismaMock.workspace.findMany).toHaveBeenCalledWith({
      where: { createdBy: 'creator-uuid', active: true },
    });
    expect(results).toHaveLength(dbRecords.length);
    expect(results[0]).toBeInstanceOf(Workspace);
    // @ts-ignore
    expect(results[0].workspaceKey).toBe('key-1');
    // @ts-ignore
    expect(results[1].workspaceKey).toBe('key-2');
  });

  it('findByWorkspaceKey() should return Workspace for given key if active', async () => {
    const dbRecord = {
      uuid: 'uuid-10',
      workspace_key: 'key-10',
      name: 'Workspace 10',
      createdBy: 'creator-uuid',
      active: true,
      created_at: new Date(),
      updated_at: new Date(),
      deleted_at: null,
    };
    prismaMock.workspace.findUnique.mockResolvedValue(dbRecord);

    const result = await repo.findByWorkspaceKey('key-10');

    expect(prismaMock.workspace.findUnique).toHaveBeenCalledWith({
      where: { workspaceKey: 'key-10' },
    });
    expect(result).toBeInstanceOf(Workspace);
    expect(result?.workspaceKey).toBe('key-10');
  });

  it('findByWorkspaceKey() should return null if workspace not found or inactive', async () => {
    prismaMock.workspace.findUnique.mockResolvedValue(null);
    const resultNull = await repo.findByWorkspaceKey('non-existent-key');
    expect(resultNull).toBeNull();

    prismaMock.workspace.findUnique.mockResolvedValue({
      uuid: 'uuid-11',
      workspace_key: 'key-11',
      name: 'Inactive WS',
      created_by: 'creator-uuid',
      active: false,
      created_at: new Date(),
      updated_at: new Date(),
      deleted_at: null,
    });
    const resultInactive = await repo.findByWorkspaceKey('key-11');
    expect(resultInactive).toBeNull();
  });
});
