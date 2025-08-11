import 'reflect-metadata';
import { StatusCodes } from 'http-status-codes';
import { describe, it, expect, beforeEach, beforeAll } from 'vitest';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import type { UserResponseDto } from '../../../src/application/dto/user/UserResponseDto.ts';
import type { UserRole } from '../../../src/domain/enums/UserRole.ts';
import { AuthService } from '../../../src/application/services/AuthService.ts';

process.env.JWT_SECRET = 'test_secret';
process.env.JWT_EXPIRES_IN_MINUTES = '60';

const mockUser: UserResponseDto = {
    uuid: 'a1b2c3d4-e5f6-7890-1234-567890abcdef',
    email: 'test@example.com',
    name: 'Test User',
    role: 'ADMIN' as UserRole,
    createdAt: new Date(),
    updatedAt: new Date(),
};

describe('AuthService', () => {
    let authService: AuthService;

    beforeEach(() => {
        authService = new AuthService();
    });

    describe('hashPassword', () => {
        it('should return a hashed password', async () => {
            const password = 'mySecretPassword';
            const response = await authService.hashPassword(password);

            expect(response.httpStatusCode).toBe(StatusCodes.CREATED);
            expect(response.payload).toBeDefined();
            expect(typeof response.payload).toBe('string');
            expect(response.payload).not.toBe(password);
            
            const isHashed = await bcrypt.compare(password, response.payload);
            expect(isHashed).toBe(true);
        });
    });

    describe('verifyPassword', () => {
        let hashedPassword: string;

        beforeAll(async () => {
            const response = await bcrypt.hash('mySecretPassword', 10);
            hashedPassword = response;
        });

        it('should return true for a correct password', async () => {
            const response = await authService.verifyPassword('mySecretPassword', hashedPassword);

            expect(response.httpStatusCode).toBe(StatusCodes.OK);
            expect(response.payload).toBe(true);
            expect(response.message).toBe('Password is valid.');
        });

        it('should return false for an incorrect password', async () => {
            const response = await authService.verifyPassword('wrongPassword', hashedPassword);

            expect(response.httpStatusCode).toBe(StatusCodes.OK);
            expect(response.payload).toBe(false);
            expect(response.message).toBe('Invalid password.');
        });
    });

    describe('generateToken', () => {
        it('should return a valid JWT token string', async () => {
            const response = await authService.generateToken(mockUser);

            expect(response.httpStatusCode).toBe(StatusCodes.CREATED);
            expect(response.payload).toBeDefined();
            expect(typeof response.payload).toBe('string');

            const decoded = jwt.verify(response.payload as string, process.env.JWT_SECRET as string) as UserResponseDto;
            expect(decoded.uuid).toBe(mockUser.uuid);
            expect(decoded.email).toBe(mockUser.email);
            expect(decoded.role).toBe(mockUser.role);
        });
    });

    describe('verifyToken', () => {
        let token: string;

        beforeAll(() => {
            const payload = {
                uuid: mockUser.uuid,
                email: mockUser.email,
                name: mockUser.name,
                role: mockUser.role,
            };
            token = jwt.sign(payload, process.env.JWT_SECRET as string, { expiresIn: '1h' });
        });

        it('should successfully verify a valid token', async () => {
            const response = await authService.verifyToken(token);

            expect(response.httpStatusCode).toBe(StatusCodes.OK);
            expect(response.payload).toBeDefined();
            expect(response.payload?.email).toBe(mockUser.email);
            expect(response.message).toBe('Token verified successfully.');
        });

        it('should return an error for an invalid token', async () => {
            const invalidToken = 'this.is.a.bad.token';
            const response = await authService.verifyToken(invalidToken);

            expect(response.httpStatusCode).toBe(StatusCodes.UNAUTHORIZED);
            expect(response.payload).toBeNull();
            expect(response.message).toBe('Invalid token.');
        });

        it('should return an error for an expired token', async () => {
            const expiredToken = jwt.sign(mockUser, process.env.JWT_SECRET as string, { expiresIn: '1ms' });

            await new Promise(resolve => setTimeout(resolve, 5));

            const response = await authService.verifyToken(expiredToken);
            
            expect(response.httpStatusCode).toBe(StatusCodes.UNAUTHORIZED);
            expect(response.payload).toBeNull();
            expect(response.message).toBe('Token has expired.');
        });
    });
});
