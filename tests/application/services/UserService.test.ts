import 'reflect-metadata';
import { describe, it, beforeEach, expect, vi } from 'vitest';
import { StatusCodes } from 'http-status-codes';
import { UserService } from '../../../src/application/services/UserService.ts';
import { UserRole } from '../../../src/domain/enums/UserRole.ts';
import { NotFoundError } from '../../../src/shared/Errors/NotFoundError.ts';

describe('UserService', () => {
    let mockRepo: any;
    let mockAuth: any;
    let service: UserService;

    beforeEach(() => {
        mockRepo = {
            create: vi.fn(),
            update: vi.fn(),
            findByEmail: vi.fn(),
            findByWorkspace: vi.fn(),
            findByUuid: vi.fn(),
        };
        mockAuth = {
            hashPassword: vi.fn(),
            verifyPassword: vi.fn(),
        };
        service = new UserService(mockRepo, mockAuth);
    });

    describe('create (wrapped)', () => {
        it('should create a new user successfully', async () => {
            mockRepo.findByEmail.mockResolvedValue(null);
            mockAuth.hashPassword.mockResolvedValue({ payload: 'hashed-pass' });
            mockRepo.create.mockResolvedValue({
                uuid: 'e02c7a29-c9a4-473d-8446-9e7456cf3668',
                email: 'test@mail.com',
                name: 'Test',
                role: UserRole.ASSOCIATE,
                createdAt: new Date(),
                updatedAt: new Date(),
            });

            const result = await service.create({
                email: 'test@mail.com',
                password: 'secret',
                name: 'Test',
                role: UserRole.ASSOCIATE,
            });

            expect(result.httpStatusCode).toBe(StatusCodes.CREATED);
            expect(result.payload.email).toBe('test@mail.com');
        });

        it('should return ServiceResponse with error if repo throws', async () => {
            mockRepo.findByEmail.mockRejectedValue(new Error('DB fail'));

            const result = await service.create({
                email: 'x@mail.com',
                password: 'secret',
                name: 'X',
                role: UserRole.ASSOCIATE,
            });

            expect(result.httpStatusCode).toBe(StatusCodes.INTERNAL_SERVER_ERROR);
            expect(result.payload).toBeNull();
        });

        it('should return Conflict status if email already exists', async () => {
            mockRepo.findByEmail.mockResolvedValue({ email: 'exists@mail.com' });

            const result = await service.create({
                email: 'exists@mail.com',
                password: 'secret',
                name: 'Dup',
                role: UserRole.ASSOCIATE,
            });

            expect(result.httpStatusCode).toBe(StatusCodes.CONFLICT);
            expect(result.payload).toBeNull();
        });

        it('should return ExpectationFailed status if password hashing fails', async () => {
            mockRepo.findByEmail.mockResolvedValue(null);
            mockAuth.hashPassword.mockResolvedValue({ payload: null });

            const result = await service.create({
                email: 'new@mail.com',
                password: 'secret',
                name: 'FailHash',
                role: UserRole.ASSOCIATE,
            });

            expect(result.httpStatusCode).toBe(StatusCodes.EXPECTATION_FAILED);
            expect(result.payload).toBeNull();
        });
    });

    describe('getUserByEmail', () => {
        it('should return user when found', async () => {
            mockRepo.findByEmail.mockResolvedValue({
                uuid: 'e02c7a29-c9a4-473d-8446-9e7456cf3668',
                email: 'found@mail.com',
                name: 'Found',
                role: UserRole.MANAGER,
                createdAt: new Date(),
                updatedAt: new Date(),
            });

            const result = await service.getUserByEmail('found@mail.com');

            expect(result.httpStatusCode).toBe(StatusCodes.OK);
            // @ts-ignore
            expect(result.payload.email).toBe('found@mail.com');
        });

        it('should return NOT_FOUND status when user not found', async () => {
            mockRepo.findByEmail.mockRejectedValue(new NotFoundError('User not found'));

            const result = await service.getUserByEmail('missing@mail.com');

            expect(result.httpStatusCode).toBe(StatusCodes.NOT_FOUND);
            expect(result.payload).toBeNull();
        });
    });

    describe('getUsersByWorkspace', () => {
        it('should return list of users', async () => {
            mockRepo.findByWorkspace.mockResolvedValue([
                {
                    uuid: 'e02c7a29-c9a4-473d-8446-9e7456cf3668',
                    email: 'a@mail.com',
                    name: 'A',
                    role: UserRole.ADMIN,
                    createdAt: new Date(),
                    updatedAt: new Date(),
                },
            ]);

            const result = await service.getUsersByWorkspace('w1');

            expect(result.httpStatusCode).toBe(StatusCodes.OK);
            expect(Array.isArray(result.payload)).toBe(true);
            expect(result.payload.length).toBe(1);
        });

        it('should return NOT_FOUND if workspace not found', async () => {
            mockRepo.findByWorkspace.mockRejectedValue(new NotFoundError('Workspace not found'));

            const result = await service.getUsersByWorkspace('missing-workspace');

            expect(result.httpStatusCode).toBe(StatusCodes.NOT_FOUND);
            expect(result.payload).toBeNull();
        });
    });

    describe('authenticateUser', () => {
        it('should authenticate successfully', async () => {
            mockRepo.findByEmail.mockResolvedValue({
                uuid: 'e02c7a29-c9a4-473d-8446-9e7456cf3668',
                email: 'auth@mail.com',
                name: 'Auth',
                role: UserRole.MANAGER,
                passwordHash: 'hashed',
                createdAt: new Date(),
                updatedAt: new Date(),
            });
            mockAuth.verifyPassword.mockResolvedValue({ payload: true });

            const result = await service.authenticateUser('auth@mail.com', 'password');

            expect(result.httpStatusCode).toBe(StatusCodes.OK);
            // @ts-ignore
            expect(result.payload.email).toBe('auth@mail.com');
        });

        it('should return UNAUTHORIZED status if user not found', async () => {
            mockRepo.findByEmail.mockRejectedValue(new NotFoundError('User not found'));

            const result = await service.authenticateUser('missing@mail.com', 'pass');

            expect(result.httpStatusCode).toBe(StatusCodes.UNAUTHORIZED);
            expect(result.payload).toBeNull();
        });

        it('should return UNAUTHORIZED status if password is wrong', async () => {
            mockRepo.findByEmail.mockResolvedValue({
                uuid: 'e02c7a29-c9a4-473d-8446-9e7456cf3668',
                email: 'wrong@mail.com',
                passwordHash: 'hash',
            });
            mockAuth.verifyPassword.mockResolvedValue({ payload: false });

            const result = await service.authenticateUser('wrong@mail.com', 'bad');

            expect(result.httpStatusCode).toBe(StatusCodes.UNAUTHORIZED);
            expect(result.payload).toBeNull();
        });
    });

    describe('validateUserPermissions', () => {
        it('should return OK if role meets requirement', async () => {
            mockRepo.findByUuid.mockResolvedValue({ role: UserRole.ADMIN });

            const result = await service.validateUserPermissions(
                'e02c7a29-c9a4-473d-8446-9e7456cf3668',
                UserRole.MANAGER
            );

            expect(result.httpStatusCode).toBe(StatusCodes.OK);
            expect(result.payload).toBe(true);
        });

        it('should return FORBIDDEN if role too low', async () => {
            mockRepo.findByUuid.mockResolvedValue({ role: UserRole.ASSOCIATE });

            const result = await service.validateUserPermissions(
                'e02c7a29-c9a4-473d-8446-9e7456cf3668',
                UserRole.MANAGER
            );

            expect(result.httpStatusCode).toBe(StatusCodes.FORBIDDEN);
            expect(result.payload).toBe(false);
        });

        it('should return NOT_FOUND if user not found', async () => {
            mockRepo.findByUuid.mockRejectedValue(new NotFoundError('User not found'));

            const result = await service.validateUserPermissions(
                'missing-uuid',
                UserRole.MANAGER
            );

            expect(result.httpStatusCode).toBe(StatusCodes.NOT_FOUND);
            expect(result.payload).toBeNull();
        });
    });

    describe('changePassword', () => {
        it('should change password successfully', async () => {
            mockRepo.findByUuid.mockResolvedValue({
                uuid: 'e02c7a29-c9a4-473d-8446-9e7456cf3668',
                passwordHash: 'oldhash',
            });
            mockAuth.verifyPassword.mockResolvedValue({ payload: true });
            mockAuth.hashPassword.mockResolvedValue({ payload: 'newhash' });
            mockRepo.update.mockResolvedValue({});

            const result = await service.changePassword(
                'e02c7a29-c9a4-473d-8446-9e7456cf3668',
                'old',
                'new'
            );

            expect(result.httpStatusCode).toBe(StatusCodes.OK);
            expect(mockRepo.update).toHaveBeenCalledWith(
                'e02c7a29-c9a4-473d-8446-9e7456cf3668',
                { passwordHash: 'newhash' }
            );
        });

        it('should return UNAUTHORIZED status if old password wrong', async () => {
            mockRepo.findByUuid.mockResolvedValue({
                uuid: 'e02c7a29-c9a4-473d-8446-9e7456cf3668',
                passwordHash: 'oldhash',
            });
            mockAuth.verifyPassword.mockResolvedValue({ payload: false });

            const result = await service.changePassword(
                'e02c7a29-c9a4-473d-8446-9e7456cf3668',
                'wrong',
                'new'
            );

            expect(result.httpStatusCode).toBe(StatusCodes.UNAUTHORIZED);
            expect(result.payload).toBeNull();
        });

        it('should return EXPECTATION_FAILED status if hashing new password fails', async () => {
            mockRepo.findByUuid.mockResolvedValue({
                uuid: 'e02c7a29-c9a4-473d-8446-9e7456cf3668',
                passwordHash: 'oldhash',
            });
            mockAuth.verifyPassword.mockResolvedValue({ payload: true });
            mockAuth.hashPassword.mockResolvedValue({ payload: null });

            const result = await service.changePassword(
                'e02c7a29-c9a4-473d-8446-9e7456cf3668',
                'old',
                'new'
            );

            expect(result.httpStatusCode).toBe(StatusCodes.EXPECTATION_FAILED);
            expect(result.payload).toBeNull();
        });

        it('should return NOT_FOUND status if user not found', async () => {
            mockRepo.findByUuid.mockRejectedValue(new NotFoundError('User not found'));

            const result = await service.changePassword(
                'missing-uuid',
                'old',
                'new'
            );

            expect(result.httpStatusCode).toBe(StatusCodes.NOT_FOUND);
            expect(result.payload).toBeNull();
        });
    });
});
