import { StatusCodes } from "http-status-codes";
import { User } from "../../domain/entities/User.ts";
import type { IUserRepository } from "../../domain/repositories/IUserRepository.ts";
import type { IAuthService } from "../../domain/services/IAuthService.ts";
import type { IUserService } from "../../domain/services/IUserService.ts";
import { ValidationError } from "../../shared/Errors/ValidationError.ts";
import type { UserRequestDto } from "../dto/user/UserRequestDto.ts";
import type { UserResponseDto } from "../dto/user/UserResponseDto.ts";
import { BaseService } from "./BaseService.ts";
import type { ServiceResponse } from "../../domain/services/ServiceResponse.ts";
import { ConflictError } from "../../shared/Errors/ConflictError.ts";
import { ExpectationError } from "../../shared/Errors/ExpectationError.ts";
import { UserRole } from "../../domain/enums/UserRole.ts";
import { UnauthorizedError } from "../../shared/Errors/UnauthorizedError.ts";
import { NotFoundError } from "../../shared/Errors/NotFoundError.ts";

export class UserService extends BaseService<User, UserRequestDto, UserResponseDto, IUserRepository> implements IUserService {

    private static readonly roleHierarchy = {
        [UserRole.ASSOCIATE]: 1,
        [UserRole.MANAGER]: 2,
        [UserRole.ADMIN]: 3
    };

    constructor(
        protected readonly userRepository: IUserRepository,
        private readonly authService: IAuthService
    ) {
        super(userRepository, 'UserService');
        this.create = this.exceptionCatcher.wrapMethod(this.create.bind(this), 'create');
        this.getUserByEmail = this.exceptionCatcher.wrapMethod(this.getUserByEmail.bind(this), 'getUserByEmail');
        this.getUsersByWorkspace = this.exceptionCatcher.wrapMethod(this.getUsersByWorkspace.bind(this), 'getUsersByWorkspace');
        this.authenticateUser = this.exceptionCatcher.wrapMethod(this.authenticateUser.bind(this), 'authenticateUser');
        this.validateUserPermissions = this.exceptionCatcher.wrapMethod(this.validateUserPermissions.bind(this), 'validateUserPermissions');
        this.changePassword = this.exceptionCatcher.wrapMethod(this.changePassword.bind(this), 'changePassword');
    }

    protected toResponseDto(entity: User): UserResponseDto {
        return {
            uuid: entity.uuid,
            email: entity.email,
            name: entity.name,
            role: entity.role,
            createdAt: entity.createdAt,
            updatedAt: entity.updatedAt,
        };
    }

    protected toEntity(request: UserRequestDto): User {
        if (request.password) {
            throw new ValidationError('Password should not be updated via the generic update method. Use changePassword instead.');
        }
        return new User(
            request.email,
            '',
            request.name,
            request.role
        );
    }

    protected updateEntity(entity: User, updates: Partial<UserRequestDto>): User {
        if (updates.email) {
            entity.email = updates.email;
        }
        if (updates.name) {
            entity.name = updates.name;
        }
        if (updates.role) {
            entity.role = updates.role;
        }
        return entity;
    }

    public async create(userDto: UserRequestDto): Promise<ServiceResponse<UserResponseDto>> {
        const existingUser = await this.userRepository.findByEmail(userDto.email);
        if (existingUser) {
            throw new ConflictError(`There is already an user registered with the e-mail ${userDto.email}`)
        }

        const passwordHashResponse = await this.authService.hashPassword(userDto.password);
        if (!passwordHashResponse.payload) {
            throw new ExpectationError('Could not register, try later or contact our support')
        }
        const passwordHash = passwordHashResponse.payload;

        const newUser = new User(userDto.email, passwordHash, userDto.name, userDto.role);
        newUser.validate();
        const createdUser = await this.userRepository.create(newUser);
        const userResponseDto = this.toResponseDto(createdUser);

        return {
            httpStatusCode: StatusCodes.CREATED,
            payload: userResponseDto,
            message: 'User created successfully.'
        };
    }

    public async getUserByEmail(email: string): Promise<ServiceResponse<UserResponseDto | null>> {
        const user = await this.userRepository.findByEmail(email);
        const userResponseDto = this.toResponseDto(user);
        return {
            httpStatusCode: StatusCodes.OK,
            payload: userResponseDto,
            message: 'User found.'
        };
    }

    public async getUsersByWorkspace(workspaceUuid: string): Promise<ServiceResponse<Array<UserResponseDto>>> {
        const users = await this.userRepository.findByWorkspace(workspaceUuid);
        const userResponseDtos = users.map(user => this.toResponseDto(user));
        return {
            httpStatusCode: StatusCodes.OK,
            payload: userResponseDtos,
            message: 'Users for workspace retrieved successfully.'
        };
    }

    public async authenticateUser(email: string, password: string): Promise<ServiceResponse<UserResponseDto | null>> {
        let user;
        try {
            user = await this.userRepository.findByEmail(email);
        } catch (error) {
            // @ts-ignore
            if (error.name === 'NotFoundError') {
                throw new UnauthorizedError('Invalid email or password.');
            }
            throw error;
        }

        const isPasswordCorrect = await this.authService.verifyPassword(password, user.passwordHash);
        if (!isPasswordCorrect.payload) {
            throw new UnauthorizedError('Invalid email or password.');
        }

        const userResponseDto = this.toResponseDto(user);
        return {
            httpStatusCode: StatusCodes.OK,
            payload: userResponseDto,
            message: 'User authenticated successfully.',
        };
    }

    public async validateUserPermissions(userUuid: string, requiredRole: UserRole): Promise<ServiceResponse<boolean>> {
        const user = await this.userRepository.findByUuid(userUuid);
        const userRoleValue = UserService.roleHierarchy[user.role];
        const requiredRoleValue = UserService.roleHierarchy[requiredRole];
        const hasPermission = userRoleValue >= requiredRoleValue;
        return {
            httpStatusCode: hasPermission ? StatusCodes.OK : StatusCodes.FORBIDDEN,
            payload: hasPermission,
            message: hasPermission ? 'User has required permissions.' : 'User does not have required permissions.'
        };
    }

    public async changePassword(userUuid: string, oldPassword: string, newPassword: string): Promise<ServiceResponse<void>> {
        const user = await this.userRepository.findByUuid(userUuid);
        const isPasswordCorrect = await this.authService.verifyPassword(oldPassword, user.passwordHash);
        if (!isPasswordCorrect.payload) {
            throw new UnauthorizedError('Password is wrong')
        }

        const newPasswordHashResponse = await this.authService.hashPassword(newPassword);
        if (!newPasswordHashResponse.payload) {
            throw new ExpectationError('Could not register, try later or contact our support')
        }
        const newPasswordHash = newPasswordHashResponse.payload;

        user.passwordHash = newPasswordHash;
        await this.userRepository.update(userUuid, { passwordHash: newPasswordHash });

        return {
            httpStatusCode: StatusCodes.OK,
            payload: undefined,
            message: 'Password changed successfully.'
        };
    }
}