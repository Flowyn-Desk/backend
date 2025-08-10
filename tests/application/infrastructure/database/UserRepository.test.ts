import 'reflect-metadata';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { User } from '../../../../src/domain/entities/User.js';
import type { UserRole } from '../../../../src/domain/enums/UserRole.js';
import { UserRepository } from '../../../../src/application/infrastructure/database/UserRepository.ts';

describe('UserRepository', () => {
  let prismaMock: any;
  let repo: UserRepository;

  const fakeRecord = {
    uuid: '123',
    email: 'test@example.com',
    passwordHash: 'hash',
    name: 'John Doe',
    role: 'ADMIN' as UserRole,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-02-01'),
    deletedAt: null,
    active: true,
  };

  beforeEach(() => {
    prismaMock = {
      user: {
        findFirst: vi.fn(),
        findMany: vi.fn(),
      },
    };
    repo = new UserRepository(prismaMock);
  });

  it('getModelName should return "user"', () => {
    expect(repo['getModelName']()).toBe('user');
  });

  it('mapToEntity should return a User instance', () => {
    const entity = repo['mapToEntity'](fakeRecord);
    expect(entity).toBeInstanceOf(User);
    expect(entity.email).toBe(fakeRecord.email);
  });

  it('findByEmail should return a User when found', async () => {
    prismaMock.user.findFirst.mockResolvedValue(fakeRecord);
    const result = await repo.findByEmail('test@example.com');

    expect(prismaMock.user.findFirst).toHaveBeenCalledWith({
      where: { email: 'test@example.com', active: true },
    });
    expect(result).toBeInstanceOf(User);
    expect(result?.uuid).toBe(fakeRecord.uuid);
  });

  it('findByEmail should return null when not found', async () => {
    prismaMock.user.findFirst.mockResolvedValue(null);
    const result = await repo.findByEmail('missing@example.com');
    expect(result).toBeNull();
  });

  it('findByRole should return an array of Users', async () => {
    prismaMock.user.findMany.mockResolvedValue([fakeRecord]);
    const result = await repo.findByRole('ADMIN' as UserRole);

    expect(prismaMock.user.findMany).toHaveBeenCalledWith({
      where: { role: 'ADMIN', active: true },
    });
    expect(result).toHaveLength(1);
    expect(result[0]).toBeInstanceOf(User);
  });

  it('findByWorkspace should return an array of Users', async () => {
    prismaMock.user.findMany.mockResolvedValue([fakeRecord]);
    const result = await repo.findByWorkspace('workspace-uuid');

    expect(prismaMock.user.findMany).toHaveBeenCalledWith({
      where: {
        createdWorkspaces: { some: { uuid: 'workspace-uuid', active: true } },
        active: true,
      },
    });
    expect(result).toHaveLength(1);
    expect(result[0]).toBeInstanceOf(User);
  });
});
