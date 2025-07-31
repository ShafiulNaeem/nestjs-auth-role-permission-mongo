/**
 * Example file showing various ways to use the Exists validation decorator
 * This demonstrates Laravel-like validation rules for NestJS
 */

import { IsNotEmpty, IsOptional, IsArray } from 'class-validator';
import { Exists, ExistsRule } from '../utilis/validation';

export class ExistsExamplesDto {
    // ===== BASIC USAGE =====

    /**
     * Basic exists validation - checks if ID exists in users collection
     * Default field is '_id'
     */
    @IsNotEmpty()
    @Exists('users')
    userId: string;

    /**
     * Check existence in a custom field
     */
    @IsNotEmpty()
    @Exists('users', 'email')
    userEmail: string;

    /**
     * Check if username exists
     */
    @IsNotEmpty()
    @Exists('users', 'username')
    username: string;

    // ===== FOREIGN KEY VALIDATIONS =====

    /**
     * Validate role exists before assigning to user
     */
    @IsNotEmpty()
    @Exists('roles')
    roleId: string;

    /**
     * Validate category exists for product
     */
    @IsNotEmpty()
    @Exists('categories')
    categoryId: string;

    /**
     * Validate organization exists
     */
    @IsNotEmpty()
    @Exists('organizations')
    organizationId: string;

    // ===== WITH CONDITIONS =====

    /**
     * User must exist and be active
     */
    @IsNotEmpty()
    @Exists('users', '_id', {
        where: { status: 'active' },
        message: 'User must be active'
    })
    activeUserId: string;

    /**
     * Role must exist and not be deleted
     */
    @IsNotEmpty()
    @Exists('roles', '_id', {
        where: {
            deleted_at: null,
            status: 'active'
        },
        message: 'Role does not exist or is inactive'
    })
    activeRoleId: string;

    /**
     * Category must exist within specific organization
     */
    @IsNotEmpty()
    @Exists('categories', '_id', {
        where: {
            organization_id: 'org_123', // This would be dynamic
            status: 'active'
        }
    })
    organizationCategoryId: string;

    // ===== USING EXISTS RULE BUILDER =====

    /**
     * Laravel-style exists rule builder
     */
    @IsNotEmpty()
    @(ExistsRule('users')
        .where('status', 'active')
        .where('email_verified', true)
        .message('User must be active and verified')
        .build())
    verifiedUserId: string;

    /**
     * Complex existence check with multiple conditions
     */
    @IsNotEmpty()
    @(ExistsRule('products', '_id')
        .where('status', 'published')
        .where('category_id', 'electronics')
        .convertToObjectId()
        .message('Product must be published electronics item')
        .build())
    productId: string;

    // ===== ARRAY VALIDATIONS =====

    /**
     * Validate each item in array exists
     */
    @IsArray()
    @Exists('roles', '_id', undefined, { each: true })
    roleIds: string[];

    /**
     * Validate each user exists and is active
     */
    @IsArray()
    @Exists('users', '_id', {
        where: { status: 'active' }
    }, { each: true })
    activeUserIds: string[];

    // ===== OPTIONAL VALIDATIONS =====

    /**
     * Optional field - only validate if provided
     */
    @IsOptional()
    @Exists('users', '_id', {
        where: { role: 'manager' },
        message: 'Manager not found'
    })
    managerId?: string;

    /**
     * Optional category - validate if provided
     */
    @IsOptional()
    @Exists('categories', 'slug')
    categorySlug?: string;
}

// ===== REAL WORLD EXAMPLES =====

/**
 * User Assignment DTO
 */
export class UserAssignmentDto {
    @IsNotEmpty()
    @Exists('users', '_id', {
        where: { status: 'active' },
        message: 'User must be active'
    })
    userId: string;

    @IsNotEmpty()
    @Exists('roles', '_id', {
        where: {
            status: 'active',
            deleted_at: null
        },
        message: 'Role does not exist or is inactive'
    })
    roleId: string;

    @IsOptional()
    @Exists('organizations', '_id', {
        where: { status: 'active' }
    })
    organizationId?: string;
}

/**
 * Product Creation DTO
 */
export class CreateProductDto {
    @IsNotEmpty()
    name: string;

    @IsNotEmpty()
    @Exists('categories', '_id', {
        where: {
            status: 'active',
            type: 'product_category'
        }
    })
    categoryId: string;

    @IsNotEmpty()
    @Exists('brands', '_id', {
        where: { status: 'active' }
    })
    brandId: string;

    @IsOptional()
    @Exists('users', '_id', {
        where: {
            role: 'vendor',
            status: 'active'
        },
        message: 'Vendor must be active'
    })
    vendorId?: string;
}

/**
 * Order DTO with multiple validations
 */
export class CreateOrderDto {
    @IsNotEmpty()
    @(ExistsRule('users', '_id')
        .where('status', 'active')
        .where('email_verified', true)
        .message('Customer must be active and verified')
        .build())
    customerId: string;

    @IsArray()
    @(ExistsRule('products', '_id')
        .where('status', 'available')
        .where('stock_quantity', { $gt: 0 })
        .message('Product must be available and in stock')
        .build({ each: true }))
    productIds: string[];

    @IsOptional()
    @(ExistsRule('coupons', 'code')
        .where('status', 'active')
        .where('expires_at', { $gt: new Date() })
        .message('Coupon is invalid or expired')
        .build())
    couponCode?: string;
}

/**
 * Permission Assignment DTO
 */
export class AssignPermissionDto {
    @IsNotEmpty()
    @Exists('users', '_id', {
        where: { status: 'active' }
    })
    userId: string;

    @IsArray()
    @Exists('permissions', '_id', {
        where: { status: 'active' }
    }, { each: true })
    permissionIds: string[];

    @IsOptional()
    @Exists('roles', '_id', {
        where: {
            status: 'active',
            type: 'custom'
        }
    })
    customRoleId?: string;
}

/**
 * Multi-tenant example
 */
export class TenantUserDto {
    @IsNotEmpty()
    name: string;

    @IsNotEmpty()
    @Exists('users', 'email', {
        where: {
            organization_id: 'current_org', // This would be dynamic
            status: 'active'
        },
        message: 'User not found in this organization'
    })
    email: string;

    @IsNotEmpty()
    @(ExistsRule('roles', '_id')
        .where('organization_id', 'current_org')
        .where('status', 'active')
        .message('Role not available in this organization')
        .build())
    roleId: string;
}
