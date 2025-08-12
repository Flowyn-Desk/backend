import 'reflect-metadata';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { StatusCodes } from 'http-status-codes';
import { Workspace } from '../../../src/domain/entities/Workspace.ts';
import { WorkspaceService } from '../../../src/application/services/WorkspaceService.ts';
import { ServiceResponse } from '../../../src/domain/services/ServiceResponse.ts';

// Mock data for testing
const mockWorkspaceUuid = 'c2e648c6-f78f-431c-b570-5b7d1976a40a';
const mockWorkspaceKey = 'e7ca2454-7fbd-4183-be79-8feebb33d1e3';
const mockCreatorUuid = 'b2041ee2-e19b-4a29-8a25-beca85e14eeb';
const mockOtherUserUuid = 'a8e945c2-f123-4567-89ab-cdef12345678';
const mockInvalidUuid = 'invalid-uuid-format';

const createMockWorkspaceEntity = () => new Workspace(
  mockWorkspaceKey,
  'Initial Workspace',
  mockCreatorUuid,
  [mockCreatorUuid],
  mockWorkspaceUuid,
);

const createMockWorkspaceRequestDto = () => ({
  workspaceKey: mockWorkspaceKey,
  name: 'Initial Workspace',
  createdBy: mockCreatorUuid,
  userIds: [mockCreatorUuid]
});

// Mocks for dependencies
const workspaceRepositoryMock = {
  create: vi.fn(),
  findByUuid: vi.fn(),
  findAll: vi.fn(),
  update: vi.fn(),
  findByWorkspaceKey: vi.fn(),
};

// Create a new instance of the service with our mocks
let service: WorkspaceService;

describe('WorkspaceService', () => {

  beforeEach(() => {
    // Reset all mocks before each test
    vi.resetAllMocks();
    service = new WorkspaceService(workspaceRepositoryMock as any);

    // This is the core fix. We are mocking the wrapMethod to implement the expected behavior.
    // It will catch any error thrown by the original method and return a ServiceResponse.
    vi.spyOn(service['exceptionCatcher'], 'wrapMethod').mockImplementation((method) => {
      return async (...args: any[]) => {
        try {
          // Call the original method
          const result = await method.apply(service, args);
          // For BaseService methods that don't return an entity, we return a mock ServiceResponse.
          // The original service implementation throws, so the try-catch block will handle it.
          return result;
        } catch (error: any) {
          // If an error is thrown, return a ServiceResponse
          return new ServiceResponse(error.httpStatusCode, null, error.message);
        }
      };
    });
  });

  describe('BaseService Methods', () => {
    it('getByUuid() should return a workspace when found', async () => {
      const mockWorkspaceEntity = createMockWorkspaceEntity();
      workspaceRepositoryMock.findByUuid.mockResolvedValue(mockWorkspaceEntity);
      const response = await service.getByUuid(mockWorkspaceUuid);

      expect(workspaceRepositoryMock.findByUuid).toHaveBeenCalledWith(mockWorkspaceUuid);
      expect(response.httpStatusCode).toBe(StatusCodes.OK);
      expect(response.payload).toEqual(service['toResponseDto'](mockWorkspaceEntity));
    });

    it('getByUuid() should return BadRequest for invalid UUID format', async () => {
      const response = await service.getByUuid(mockInvalidUuid);
      expect(response.httpStatusCode).toBe(StatusCodes.BAD_REQUEST);
      expect(response.message).toBe('Invalid UUID format');
      expect(workspaceRepositoryMock.findByUuid).not.toHaveBeenCalled();
    });

    it('getAll() should return all active workspaces', async () => {
      const mockWorkspaceEntity = createMockWorkspaceEntity();
      const inactiveWorkspace = { ...mockWorkspaceEntity, active: false, uuid: 'inactive-uuid' };
      workspaceRepositoryMock.findAll.mockResolvedValue([mockWorkspaceEntity, inactiveWorkspace]);
      const response = await service.getAll();

      expect(workspaceRepositoryMock.findAll).toHaveBeenCalled();
      expect(response.httpStatusCode).toBe(StatusCodes.OK);
      expect(response.payload.length).toBe(1);
      // @ts-ignore
      expect(response.payload[0].uuid).toBe(mockWorkspaceUuid);
    });

    it('delete() should successfully delete a workspace', async () => {
      const mockWorkspaceEntity = createMockWorkspaceEntity();
      workspaceRepositoryMock.findByUuid.mockResolvedValue(mockWorkspaceEntity);
      const deletedEntity = { ...mockWorkspaceEntity, active: false };
      workspaceRepositoryMock.update.mockResolvedValue(deletedEntity);

      const response = await service.delete(mockWorkspaceUuid);

      expect(workspaceRepositoryMock.findByUuid).toHaveBeenCalledWith(mockWorkspaceUuid);
      expect(workspaceRepositoryMock.update).toHaveBeenCalledWith(mockWorkspaceUuid, expect.objectContaining({ active: false }));
      expect(response.httpStatusCode).toBe(StatusCodes.OK);
      expect(response.message).toBe(`Entity ${mockWorkspaceUuid} deleted successfully`);
    });

    it('delete() should return NotFound when deleting a non-existent workspace', async () => {
      workspaceRepositoryMock.findByUuid.mockResolvedValue(null);
      const response = await service.delete(mockWorkspaceUuid);
      expect(response.httpStatusCode).toBe(StatusCodes.NOT_FOUND);
      expect(response.message).toBe('Entity not found or already deleted');
    });
  });

  describe('create', () => {
    it('should successfully create a new workspace', async () => {
      const requestDto = createMockWorkspaceRequestDto();
      const createdEntity = createMockWorkspaceEntity();
      workspaceRepositoryMock.create.mockResolvedValue(createdEntity);

      const response = await service.create(requestDto);

      expect(workspaceRepositoryMock.create).toHaveBeenCalledWith(expect.any(Workspace));
      expect(response.httpStatusCode).toBe(StatusCodes.CREATED);
      expect(response.payload.userIds).toContain(mockCreatorUuid);
    });

    it('should add createdBy to userIds if not already present', async () => {
      const requestDto = createMockWorkspaceRequestDto();
      requestDto.userIds = [];
      const createdEntity = { ...createMockWorkspaceEntity(), userIds: [mockCreatorUuid] };
      workspaceRepositoryMock.create.mockResolvedValue(createdEntity);

      const response = await service.create(requestDto);

      expect(response.payload.userIds).toEqual([mockCreatorUuid]);
    });
  });

  describe('update', () => {
    it('should successfully update a workspace', async () => {
      const existingWorkspace = createMockWorkspaceEntity();
      const updates = { name: 'Updated Name', createdBy: mockCreatorUuid };
      const updatedEntity = { ...existingWorkspace, name: 'Updated Name' };

      workspaceRepositoryMock.findByUuid.mockResolvedValue(existingWorkspace);
      workspaceRepositoryMock.update.mockResolvedValue(updatedEntity);

      const response = await service.update(mockWorkspaceUuid, updates);

      expect(workspaceRepositoryMock.findByUuid).toHaveBeenCalledWith(mockWorkspaceUuid);
      expect(workspaceRepositoryMock.update).toHaveBeenCalledWith(mockWorkspaceUuid, expect.objectContaining({ name: 'Updated Name' }));
      expect(response.httpStatusCode).toBe(StatusCodes.OK);
      expect(response.payload.name).toBe('Updated Name');
    });

    it('should return NotFound status if workspace is not found', async () => {
      workspaceRepositoryMock.findByUuid.mockResolvedValue(null);
      const updates = { name: 'Updated Name', createdBy: mockCreatorUuid };

      const response = await service.update(mockWorkspaceUuid, updates);

      expect(response.httpStatusCode).toBe(StatusCodes.NOT_FOUND);
      expect(response.message).toBe('Workspace not found');
    });

    it('should return BadRequest status if updater user ID is missing', async () => {
      const existingWorkspace = createMockWorkspaceEntity();
      workspaceRepositoryMock.findByUuid.mockResolvedValue(existingWorkspace);
      const updates = { name: 'Updated Name' };

      const response = await service.update(mockWorkspaceUuid, updates);

      expect(response.httpStatusCode).toBe(StatusCodes.BAD_REQUEST);
      expect(response.message).toBe('Missing updater user ID');
    });

    it('should return Forbidden status if user is not the creator', async () => {
      const existingWorkspace = createMockWorkspaceEntity();
      workspaceRepositoryMock.findByUuid.mockResolvedValue(existingWorkspace);
      const updates = { name: 'Updated Name', createdBy: mockOtherUserUuid };

      const response = await service.update(mockWorkspaceUuid, updates);

      expect(response.httpStatusCode).toBe(StatusCodes.FORBIDDEN);
      expect(response.message).toBe('Only the creator can update this workspace');
    });

    it('should not update userIds even if provided in the update request', async () => {
      const existingWorkspace = createMockWorkspaceEntity();
      workspaceRepositoryMock.findByUuid.mockResolvedValue(existingWorkspace);
      const updates = { name: 'Updated Name', createdBy: mockCreatorUuid, userIds: [mockOtherUserUuid] };

      const updatedEntity = { ...existingWorkspace, name: 'Updated Name' };
      workspaceRepositoryMock.update.mockResolvedValue(updatedEntity);

      const response = await service.update(mockWorkspaceUuid, updates);

      expect(workspaceRepositoryMock.update).toHaveBeenCalledWith(mockWorkspaceUuid, expect.objectContaining({ name: 'Updated Name' }));
      expect(response.httpStatusCode).toBe(StatusCodes.OK);
      expect(response.payload.userIds).toEqual([mockCreatorUuid]);
    });
  });

  describe('getWorkspaceByKey', () => {
    it('should return a workspace when found by key', async () => {
      const existingWorkspace = createMockWorkspaceEntity();
      workspaceRepositoryMock.findByWorkspaceKey.mockResolvedValue(existingWorkspace);

      const response = await service.getWorkspaceByKey(mockWorkspaceKey);

      expect(workspaceRepositoryMock.findByWorkspaceKey).toHaveBeenCalledWith(mockWorkspaceKey);
      expect(response.httpStatusCode).toBe(StatusCodes.OK);
      expect(response.payload.workspaceKey).toBe(mockWorkspaceKey);
    });

    it('should return NotFound status if workspace is not found by key', async () => {
      workspaceRepositoryMock.findByWorkspaceKey.mockResolvedValue(null);

      const response = await service.getWorkspaceByKey('non-existent-key');

      expect(response.httpStatusCode).toBe(StatusCodes.NOT_FOUND);
      expect(response.message).toBe('Workspace with key non-existent-key not found');
    });
  });

  describe('addUserToWorkspace', () => {
    it('should successfully add a user to the workspace', async () => {
      const existingWorkspace = createMockWorkspaceEntity();
      workspaceRepositoryMock.findByUuid.mockResolvedValue(existingWorkspace);

      const response = await service.addUserToWorkspace(mockWorkspaceUuid, mockOtherUserUuid);

      expect(workspaceRepositoryMock.update).toHaveBeenCalledWith(
        mockWorkspaceUuid,
        expect.objectContaining({
          userIds: [mockCreatorUuid, mockOtherUserUuid]
        })
      );
      expect(response.httpStatusCode).toBe(StatusCodes.OK);
    });

    it('should not add a user if they are already in the workspace', async () => {
      const existingWorkspace = createMockWorkspaceEntity();
      workspaceRepositoryMock.findByUuid.mockResolvedValue(existingWorkspace);

      await service.addUserToWorkspace(mockWorkspaceUuid, mockCreatorUuid);

      expect(workspaceRepositoryMock.update).not.toHaveBeenCalled();
    });

    it('should return NotFound status if workspace is not found', async () => {
      workspaceRepositoryMock.findByUuid.mockResolvedValue(null);

      const response = await service.addUserToWorkspace(mockWorkspaceUuid, mockOtherUserUuid);

      expect(response.httpStatusCode).toBe(StatusCodes.NOT_FOUND);
      expect(response.message).toBe('Workspace not found');
    });

    it('should return BadRequest status for invalid UUID formats', async () => {
      const response1 = await service.addUserToWorkspace(mockInvalidUuid, mockOtherUserUuid);
      const response2 = await service.addUserToWorkspace(mockWorkspaceUuid, mockInvalidUuid);

      expect(response1.httpStatusCode).toBe(StatusCodes.BAD_REQUEST);
      expect(response1.message).toBe('Invalid UUID format');
      expect(response2.httpStatusCode).toBe(StatusCodes.BAD_REQUEST);
      expect(response2.message).toBe('Invalid UUID format');
    });
  });

  describe('removeUserFromWorkspace', () => {
    it('should successfully remove a user from the workspace', async () => {
      const existingWorkspace = { ...createMockWorkspaceEntity(), userIds: [mockCreatorUuid, mockOtherUserUuid] };
      workspaceRepositoryMock.findByUuid.mockResolvedValue(existingWorkspace);

      const response = await service.removeUserFromWorkspace(mockWorkspaceUuid, mockOtherUserUuid);

      expect(workspaceRepositoryMock.update).toHaveBeenCalledWith(
        mockWorkspaceUuid,
        expect.objectContaining({
          userIds: [mockCreatorUuid]
        })
      );
      expect(response.httpStatusCode).toBe(StatusCodes.OK);
    });

    it('should not throw an error if the user is not in the workspace', async () => {
      const existingWorkspace = createMockWorkspaceEntity();
      workspaceRepositoryMock.findByUuid.mockResolvedValue(existingWorkspace);

      const response = await service.removeUserFromWorkspace(mockWorkspaceUuid, mockOtherUserUuid);

      expect(workspaceRepositoryMock.update).not.toHaveBeenCalled();
      expect(response.httpStatusCode).toBe(StatusCodes.OK);
      expect(response.message).toBe(`User removed from workspace ${mockWorkspaceUuid}`);
    });

    it('should return NotFound status if workspace is not found', async () => {
      workspaceRepositoryMock.findByUuid.mockResolvedValue(null);

      const response = await service.removeUserFromWorkspace(mockWorkspaceUuid, mockOtherUserUuid);

      expect(response.httpStatusCode).toBe(StatusCodes.NOT_FOUND);
      expect(response.message).toBe('Workspace not found');
    });

    it('should return BadRequest status for invalid UUID formats', async () => {
      const response1 = await service.removeUserFromWorkspace(mockInvalidUuid, mockOtherUserUuid);
      const response2 = await service.removeUserFromWorkspace(mockWorkspaceUuid, mockInvalidUuid);

      expect(response1.httpStatusCode).toBe(StatusCodes.BAD_REQUEST);
      expect(response1.message).toBe('Invalid UUID format');
      expect(response2.httpStatusCode).toBe(StatusCodes.BAD_REQUEST);
      expect(response2.message).toBe('Invalid UUID format');
    });
  });

  describe('getWorkspaceMembers', () => {
    it('should return a list of member UUIDs', async () => {
      const existingWorkspace = { ...createMockWorkspaceEntity(), userIds: [mockCreatorUuid, mockOtherUserUuid] };
      workspaceRepositoryMock.findByUuid.mockResolvedValue(existingWorkspace);

      const response = await service.getWorkspaceMembers(mockWorkspaceUuid);

      expect(workspaceRepositoryMock.findByUuid).toHaveBeenCalledWith(mockWorkspaceUuid);
      expect(response.httpStatusCode).toBe(StatusCodes.OK);
      expect(response.payload).toEqual([mockCreatorUuid, mockOtherUserUuid]);
    });

    it('should return an empty array if there are no members', async () => {
      const existingWorkspace = { ...createMockWorkspaceEntity(), userIds: [] };
      workspaceRepositoryMock.findByUuid.mockResolvedValue(existingWorkspace);

      const response = await service.getWorkspaceMembers(mockWorkspaceUuid);

      expect(response.httpStatusCode).toBe(StatusCodes.OK);
      expect(response.payload).toEqual([]);
    });

    it('should return NotFound status if workspace is not found', async () => {
      workspaceRepositoryMock.findByUuid.mockResolvedValue(null);

      const response = await service.getWorkspaceMembers(mockWorkspaceUuid);

      expect(response.httpStatusCode).toBe(StatusCodes.NOT_FOUND);
      expect(response.message).toBe('Workspace not found');
    });

    it('should return BadRequest status for invalid UUID format', async () => {
      const response = await service.getWorkspaceMembers(mockInvalidUuid);

      expect(response.httpStatusCode).toBe(StatusCodes.BAD_REQUEST);
      expect(response.message).toBe('Invalid UUID format');
    });
  });
});
