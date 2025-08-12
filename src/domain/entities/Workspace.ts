import 'reflect-metadata';
import { IsArray, IsString, IsUUID } from 'class-validator';
import { BaseEntity } from './BaseEntity.js';
import { v4 as uuidv4 } from 'uuid';

export class Workspace extends BaseEntity {
    @IsUUID()
    workspaceKey: string;

    @IsString()
    name: string;

    @IsUUID()
    createdBy: string;

    @IsArray()
    @IsUUID("all", { each: true })
    userIds: string[];

    constructor(
        workspaceKey: string,
        name: string,
        createdBy: string,
        userIds: Array<string> = [],
        uuid?: string,
        createdAt?: Date,
        updatedAt?: Date,
        deletedAt?: Date,
        active?: boolean
    ) {
        super(uuid, createdAt, updatedAt, deletedAt, active);
        this.workspaceKey = workspaceKey;
        this.name = name;
        this.createdBy = createdBy;
        this.userIds = userIds;
        if (this.workspaceKey === undefined){
            this.workspaceKey = uuidv4();
        }
    }

    addUser(userId: string): void {
        if (!this.userIds.includes(userId)) {
            this.userIds.push(userId);
        }
    }
}
