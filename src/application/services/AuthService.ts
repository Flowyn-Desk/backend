import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { StatusCodes } from 'http-status-codes';
import type { IAuthService } from "../../domain/services/IAuthService.ts";
import type { ServiceResponse } from "../../domain/services/ServiceResponse.ts";
import type { UserResponseDto } from '../dto/user/UserResponseDto.ts';
import { UserRole } from '../../domain/enums/UserRole.js';


export class AuthService implements IAuthService {
    private readonly jwtSecret: string;
    private readonly jwtExpiresInSeconds: number;
    private readonly saltRounds: number = 10;
    private static readonly roleHierarchy = {
        [UserRole.ASSOCIATE]: 1,
        [UserRole.MANAGER]: 2,
        [UserRole.ADMIN]: 3,
    };

    constructor() {
        if (!process.env.JWT_SECRET) {
            throw new Error('JWT_SECRET environment variable is not set.');
        }
        if (!process.env.JWT_EXPIRES_IN_MINUTES) {
            throw new Error('JWT_EXPIRES_IN_MINUTES environment variable is not set.');
        }

        this.jwtSecret = process.env.JWT_SECRET;
        this.jwtExpiresInSeconds = Number(process.env.JWT_EXPIRES_IN_MINUTES) * 60;
    }

    /**
     * @inheritdoc
     */
    public async hashPassword(password: string): Promise<ServiceResponse<string>> {
        try {
            const hash = await bcrypt.hash(password, this.saltRounds);
            return {
                httpStatusCode: StatusCodes.CREATED,
                payload: hash,
                message: 'Password hashed successfully.'
            };
        } catch (error) {
            console.error('Error hashing password:', error);
            return {
                httpStatusCode: StatusCodes.INTERNAL_SERVER_ERROR,
                payload: '',
                message: 'Failed to hash password.'
            };
        }
    }

    /**
     * @inheritdoc
     */
    public async verifyPassword(password: string, hash: string): Promise<ServiceResponse<boolean>> {
        try {
            const isMatch = await bcrypt.compare(password, hash);
            return {
                httpStatusCode: StatusCodes.OK,
                payload: isMatch,
                message: isMatch ? 'Password is valid.' : 'Invalid password.'
            };
        } catch (error) {
            console.error('Error verifying password:', error);
            return {
                httpStatusCode: StatusCodes.INTERNAL_SERVER_ERROR,
                payload: false,
                message: 'Failed to verify password.'
            };
        }
    }

    /**
     * @inheritdoc
     */
    public async generateToken(user: UserResponseDto): Promise<ServiceResponse<string>> {
        try {
            const payload = {
                uuid: user.uuid,
                email: user.email,
                name: user.name,
                role: user.role,
            };

            const secret: jwt.Secret = this.jwtSecret;
            const signOptions: jwt.SignOptions = { expiresIn: this.jwtExpiresInSeconds };

            const token = jwt.sign(payload, secret, signOptions);
            return {
                httpStatusCode: StatusCodes.CREATED,
                payload: token,
                message: 'Token generated successfully.'
            };
        } catch (error) {
            console.error('Error generating token:', error);
            return {
                httpStatusCode: StatusCodes.INTERNAL_SERVER_ERROR,
                payload: '',
                message: 'Failed to generate token.'
            };
        }
    }

    /**
     * @inheritdoc
     */
    public verifyToken(token: string): ServiceResponse<UserResponseDto | null> {
        try {
            const secret: jwt.Secret = this.jwtSecret;
            const decoded = jwt.verify(token, secret) as UserResponseDto;
            return {
                httpStatusCode: StatusCodes.OK,
                payload: decoded,
                message: 'Token verified successfully.'
            };
        } catch (error) {
            console.error('Error verifying token:', error);
            if (error instanceof jwt.TokenExpiredError) {
                return {
                    httpStatusCode: StatusCodes.UNAUTHORIZED,
                    payload: null,
                    message: 'Token has expired.'
                };
            }
            if (error instanceof jwt.JsonWebTokenError) {
                return {
                    httpStatusCode: StatusCodes.UNAUTHORIZED,
                    payload: null,
                    message: 'Invalid token.'
                };
            }
            return {
                httpStatusCode: StatusCodes.INTERNAL_SERVER_ERROR,
                payload: null,
                message: 'Failed to verify token.'
            };
        }
    }

    public userHasAccess(token: string, requiredRole: UserRole): ServiceResponse<boolean> {
        try {
            if (token?.startsWith('Bearer ')) {
                token = token.slice(7).trim();
            }
            const verifyResult = this.verifyToken(token);
            if (!verifyResult.payload) {
                return {
                    httpStatusCode: verifyResult.httpStatusCode,
                    payload: false,
                    message: verifyResult.message,
                };
            }

            const user: UserResponseDto = verifyResult.payload;
            const userRoleValue = AuthService.roleHierarchy[user.role];
            const requiredRoleValue = AuthService.roleHierarchy[requiredRole];

            const hasAccess = userRoleValue >= requiredRoleValue;
            return {
                httpStatusCode: hasAccess ? StatusCodes.OK : StatusCodes.FORBIDDEN,
                payload: hasAccess,
                message: hasAccess ? 'User has required access.' : 'User does not have required access.',
            };
        } catch (error) {
            console.error('Error checking user access:', error);
            return {
                httpStatusCode: StatusCodes.INTERNAL_SERVER_ERROR,
                payload: false,
                message: 'Failed to verify user access.',
            };
        }
    }
}