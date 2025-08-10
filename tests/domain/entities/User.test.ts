import 'reflect-metadata';
import { describe, it, expect } from 'vitest';
import { User } from '../../../src/domain/entities/User.ts';
import { UserRole } from '../../../src/domain/enums/UserRole.ts';

describe('User entity basic test', () => {
  it('should create a User instance with given properties', () => {
    const user = new User(
      'user@example.com',
      'hashed_password_123',
      'John Doe',
      UserRole.ADMIN
    );

    expect(user.email).toBe('user@example.com');
    expect(user.passwordHash).toBe('hashed_password_123');
    expect(user.name).toBe('John Doe');
    expect(user.role).toBe(UserRole.ADMIN);
  });
});
