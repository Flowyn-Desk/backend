import {IsEmail, IsEnum, IsString} from "class-validator";
import { BaseEntity } from "./BaseEntity.js";
import { UserRole } from "../enums/UserRole.js";

export class User extends BaseEntity {

    @IsEmail()
    email: string;

    @IsString()
    passwordHash: string;

    @IsString()
    name: string;

    @IsEnum(UserRole)
    role: UserRole;

    constructor(
        email: string,
        passwordHash: string,
        name: string,
        role: UserRole,
        uuid?: string,
        createdAt?: Date,
        updatedAt?: Date,
        deletedAt?: Date,
        active?: boolean
    ){
        super(uuid, createdAt, updatedAt, deletedAt, active)
        this.email = email;
        this.passwordHash = passwordHash;
        this.name = name;
        this.role = role;
    }
}