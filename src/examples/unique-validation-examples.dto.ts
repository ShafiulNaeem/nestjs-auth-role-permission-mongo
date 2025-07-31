/**
 * Example file showing various ways to use the Unique validation decorator
 * This demonstrates Laravel-like validation rules for NestJS
 */

import { IsEmail, IsNotEmpty, IsOptional, MinLength } from 'class-validator';
import { Unique, UniqueRule } from '../utilis/validation';

export class UserExamplesDto {
    // ===== BASIC USAGE =====

    /**
     * Basic unique validation - checks 'email' field in 'users' collection
     * Field name defaults to property name
     */
    @IsEmail()
    @Unique('users')
    email: string;

    /**
     * Unique validation with custom field name
     * Checks 'username' field in 'users' collection for this property
     */
    @IsNotEmpty()
    @Unique('users', 'username')
    handle: string;

    // ===== UPDATE SCENARIOS =====

    /**
     * For updates - ignore current record when checking uniqueness
     * Useful when updating a user's email - don't consider their current email as "taken"
     */
    @IsOptional()
    @IsEmail()
    @Unique('users', 'email', { ignoreField: 'id' })
    updateEmail?: string;

    // ===== ADVANCED USAGE WITH CONDITIONS =====

    /**
     * Unique validation with additional conditions
     * Only check uniqueness among active users
     */
    @IsNotEmpty()
    @Unique('users', 'username', {
        where: { status: 'active' },
        message: 'This username is already taken by an active user'
    })
    usernameForActiveUsers: string;

    /**
     * Complex unique validation with multiple conditions
     */
    @IsEmail()
    @Unique('users', 'email', {
        where: {
            deleted_at: null,
            status: { $in: ['active', 'pending'] }
        },
        ignoreField: 'id',
        message: 'This email is already registered'
    })
    complexEmailValidation: string;

    // ===== USING UNIQUE RULE BUILDER (Laravel-like) =====

    /**
     * Laravel-style unique rule builder
     * More readable for complex scenarios
     */
    @IsNotEmpty()
    @(UniqueRule('users', 'phone')
        .where('country_code', '+1')
        .ignore('id')
        .message('Phone number already exists in this country')
        .build())
    phone: string;

    /**
     * Another example with rule builder
     */
    @IsNotEmpty()
    @(UniqueRule('companies')
        .where('status', 'active')
        .where('type', 'business')
        .message('Company name must be unique among active businesses')
        .build())
    companyName: string;

    // ===== DIFFERENT COLLECTIONS =====

    /**
     * Unique validation against different collections
     */
    @IsNotEmpty()
    @Unique('roles', 'name')
    roleName: string;

    @IsNotEmpty()
    @Unique('categories', 'slug')
    categorySlug: string;

    @IsNotEmpty()
    @Unique('products', 'sku')
    productSku: string;

    // ===== CONDITIONAL UNIQUE VALIDATION =====

    /**
     * Unique only within a specific scope (like Laravel's unique with where clause)
     */
    @IsNotEmpty()
    @Unique('posts', 'slug', {
        where: {
            status: 'published',
            type: 'article'
        }
    })
    articleSlug: string;

    // Fields used for ignoring in updates
    @IsOptional()
    id?: string;
}

// ===== REAL WORLD EXAMPLES =====

/**
 * User Registration DTO
 */
export class UserRegistrationDto {
    @IsNotEmpty()
    name: string;

    @IsEmail()
    @Unique('users')
    email: string;

    @IsNotEmpty()
    @Unique('users')
    username: string;

    @MinLength(6)
    password: string;
}

/**
 * User Update DTO
 */
export class UserUpdateDto {
    @IsOptional()
    name?: string;

    @IsOptional()
    @IsEmail()
    @Unique('users', 'email', { ignoreField: 'id' })
    email?: string;

    @IsOptional()
    @Unique('users', 'username', { ignoreField: 'id' })
    username?: string;

    @IsOptional()
    @MinLength(6)
    password?: string;

    // This would be set from the route parameter or auth context
    id?: string;
}

/**
 * Product DTO with complex validation
 */
export class ProductDto {
    @IsNotEmpty()
    name: string;

    @IsNotEmpty()
    @(UniqueRule('products', 'sku')
        .where('deleted_at', null)
        .message('Product SKU must be unique among active products')
        .build())
    sku: string;

    @IsNotEmpty()
    @(UniqueRule('products', 'slug')
        .where('category_id', 'electronics') // This would be dynamic in real app
        .ignore('id')
        .build())
    slug: string;
}

/**
 * Organization-scoped unique validation
 */
export class OrganizationUserDto {
    @IsNotEmpty()
    name: string;

    @IsEmail()
    // Email must be unique within the organization
    @Unique('organization_users', 'email', {
        where: { organization_id: 'org_123' }, // This would be dynamic
        message: 'Email already exists in this organization'
    })
    email: string;

    @IsNotEmpty()
    // Role must be unique within department
    @(UniqueRule('organization_users', 'role')
        .where('department_id', 'dept_456') // This would be dynamic
        .where('status', 'active')
        .message('Role already assigned in this department')
        .build())
    role: string;
}
