import 'reflect-metadata';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Workspace } from '../../../../src/domain/entities/Workspace.js';
import { WorkspaceRepository } from '../../../../src/application/infrastructure/database/WorkspaceRepository.ts';

describe('WorkspaceRepository (inherited BaseRepository methods)', () => {
  let prismaMock: any;
  let repo: WorkspaceRepository;

  beforeEach(() => {
    prismaMock = {
      workspace: {
        create: vi.fn(),
        findFirst: vi.fn(),
        findMany: vi.fn(),
        update: vi.fn(),
      },
    };
    repo = new WorkspaceRepository(prismaMock);
  });

  it('create() should call prisma.workspace.create and return mapped entity', async () => {
    const entity = new Workspace('key-1', 'Test WS', 'user-uuid');
    prismaMock.workspace.create.mockResolvedValue({
      uuid: 'uuid-1',
      workspaceKey: 'key-1',
      name: 'Test WS',
      createdBy: 'user-uuid',
      active: true
    });

    const result = await repo.create(entity);

    expect(prismaMock.workspace.create).toHaveBeenCalledWith({
      data: entity.toJson()
    });
    expect(result).toBeInstanceOf(Workspace);
    expect(result.uuid).toBe('uuid-1');
  });

  it('findByUuid() should call prisma.workspace.findFirst and return entity or null', async () => {
    prismaMock.workspace.findFirst.mockResolvedValue({
      uuid: 'uuid-2',
      workspaceKey: 'key-2',
      name: 'Another WS',
      createdBy: 'user-uuid',
      active: true
    });

    const result = await repo.findByUuid('uuid-2');
    expect(prismaMock.workspace.findFirst).toHaveBeenCalledWith({
      where: { uuid: 'uuid-2', active: true }
    });
    expect(result).toBeInstanceOf(Workspace);

    prismaMock.workspace.findFirst.mockResolvedValue(null);
    const nullResult = await repo.findByUuid('not-found');
    expect(nullResult).toBeNull();
  });

  it('findAll() should return all active workspaces mapped to entities', async () => {
    prismaMock.workspace.findMany.mockResolvedValue([
      { uuid: 'uuid-3', workspaceKey: 'key-3', name: 'WS3', createdBy: 'user-uuid', active: true }
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
      workspaceKey: 'key-4',
      name: 'Updated WS',
      createdBy: 'user-uuid',
      active: true
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
});
