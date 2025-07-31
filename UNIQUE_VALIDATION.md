# Global Validation Decorators for NestJS

A Laravel-like validation decorator system for NestJS with MongoDB integration, including **Unique** and **Exists** validation rules.

## Features

- 🚀 **Laravel-like syntax** - Familiar validation rules for Laravel developers
- 🔧 **Global availability** - Use across all DTOs without additional imports
- 🎯 **Smart field detection** - Automatically uses property name if field not specified
- 🔄 **Update-friendly** - Ignore current record during updates (Unique)
- 🎨 **Flexible conditions** - Add custom where clauses for complex scenarios
- 🏗️ **Builder pattern** - Chainable methods for complex validations
- 💬 **Custom messages** - Set custom error messages
- ✅ **Foreign key validation** - Validate relationships exist (Exists)

## Installation & Setup

The validation system is already configured in your application. Just import and use!

## Basic Usage

### Unique Validation

```typescript
import { Unique } from '../utilis/validation';

export class UserDto {
    @IsEmail()
    @Unique('users') // Checks 'email' field in 'users' collection
    email: string;
    
    @IsNotEmpty()
    @Unique('users') // Checks 'username' field in 'users' collection
    username: string;
}
```

### Exists Validation

```typescript
import { Exists } from '../utilis/validation';

export class AssignRoleDto {
    @IsNotEmpty()
    @Exists('users') // Checks if user ID exists in 'users' collection
    userId: string;
    
    @IsNotEmpty()
    @Exists('roles') // Checks if role ID exists in 'roles' collection
    roleId: string;
    
    @IsNotEmpty()
    @Exists('users', 'email') // Check if email exists in users
    userEmail: string;
}
```

### Custom Field Name

```typescript
export class UserDto {
    @Unique('users', 'email_address') // Check 'email_address' field instead
    email: string;
    
    @Exists('users', 'username') // Check if username exists
    existingUsername: string;
}
```

## Exists Validation Examples

### Basic Foreign Key Validation

```typescript
export class CreatePostDto {
    @IsNotEmpty()
    title: string;
    
    @IsNotEmpty()
    @Exists('users') // Validate author exists
    authorId: string;
    
    @IsNotEmpty()
    @Exists('categories') // Validate category exists
    categoryId: string;
}
```

### With Conditions

```typescript
export class AssignRoleDto {
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
        }
    })
    roleId: string;
}
```

### Array Validation

```typescript
export class BulkAssignDto {
    @IsArray()
    @Exists('users', '_id', { 
        where: { status: 'active' } 
    }, { each: true })
    userIds: string[];
    
    @IsArray()
    @Exists('permissions', '_id', undefined, { each: true })
    permissionIds: string[];
}
```

## Update Scenarios

When updating records, you need to ignore the current record to avoid false positive validation errors:

```typescript
export class UpdateUserDto {
    @IsOptional()
    @IsEmail()
    @Unique('users', 'email', { ignoreField: 'id' })
    email?: string;
    
    // This field should be populated with the current record's ID
    id?: string;
}
```

## Advanced Usage

### With Additional Conditions

```typescript
export class UserDto {
    @Unique('users', 'username', { 
        where: { status: 'active' },
        message: 'This username is already taken by an active user'
    })
    username: string;
    
    @Unique('users', 'email', {
        where: { 
            deleted_at: null,
            status: { $in: ['active', 'pending'] }
        },
        ignoreField: 'id',
        message: 'This email is already registered'
    })
    email: string;
}
```

## Laravel-like Rule Builder

For complex scenarios, use the fluent builder pattern:

### Unique Rule Builder

```typescript
import { UniqueRule } from '../utilis/validation';

export class ProductDto {
    @IsNotEmpty()
    @(UniqueRule('products', 'sku')
        .where('deleted_at', null)
        .message('Product SKU must be unique among active products')
        .build())
    sku: string;
    
    @IsNotEmpty()
    @(UniqueRule('users', 'phone')
        .where('country_code', '+1')
        .ignore('id')
        .message('Phone number already exists in this country')
        .build())
    phone: string;
}
```

### Exists Rule Builder

```typescript
import { ExistsRule } from '../utilis/validation';

export class OrderDto {
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
}
```

## Real-World Examples

### User Registration

```typescript
export class RegisterDto {
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
```

### User Update

```typescript
export class UpdateUserDto {
    @IsOptional()
    @IsEmail()
    @Unique('users', 'email', { ignoreField: 'id' })
    email?: string;

    @IsOptional()
    @Unique('users', 'username', { ignoreField: 'id' })
    username?: string;

    // Set this from route params or auth context
    id?: string;
}
```

### Multi-tenant Application

```typescript
export class OrganizationUserDto {
    @IsEmail()
    // Email must be unique within the organization
    @Unique('organization_users', 'email', {
        where: { organization_id: 'org_123' }, // Dynamic in real app
        message: 'Email already exists in this organization'
    })
    email: string;
}
```

### Product Management

```typescript
export class ProductDto {
    @IsNotEmpty()
    name: string;

    @IsNotEmpty()
    @(UniqueRule('products', 'sku')
        .where('category_id', 'electronics')
        .where('status', 'active')
        .ignore('id')
        .message('SKU must be unique within this category')
        .build())
    sku: string;
}
```

## API Reference

### `@Unique(collection, field?, options?, validationOptions?)`

- **collection**: MongoDB collection name
- **field**: Field name to check (defaults to property name)
- **options**: Validation options object
- **validationOptions**: class-validator options

### `@Exists(collection, field?, options?, validationOptions?)`

- **collection**: MongoDB collection name
- **field**: Field name to check (defaults to '_id')
- **options**: Validation options object
- **validationOptions**: class-validator options

### Unique Options Object

```typescript
interface UniqueValidationOptions {
    ignoreField?: string;           // Field to ignore (for updates)
    message?: string;               // Custom error message
    where?: Record<string, any>;    // Additional query conditions
}
```

### Exists Options Object

```typescript
interface ExistsValidationOptions {
    message?: string;               // Custom error message
    where?: Record<string, any>;    // Additional query conditions
    convertToObjectId?: boolean;    // Convert string to ObjectId for _id
}
```

### Rule Builders

#### `UniqueRule(collection, field?)`

Returns a builder with the following methods:

- `.where(field, value)` - Add where condition
- `.ignore(field)` - Set ignore field
- `.message(message)` - Set custom message
- `.build()` - Build the decorator

#### `ExistsRule(collection, field?)`

Returns a builder with the following methods:

- `.where(field, value)` - Add where condition
- `.message(message)` - Set custom message
- `.convertToObjectId()` - Enable ObjectId conversion
- `.build()` - Build the decorator

## Error Messages

### Default Messages

- **Unique**: `"The {field} has already been taken."`
- **Exists**: `"The selected {field} does not exist."`

### Custom Error Messages

Custom error messages can be set using the `message` option:

```typescript
@Unique('users', 'email', {
    message: 'This email address is already registered'
})
email: string;

@Exists('users', '_id', {
    message: 'Selected user does not exist'
})
userId: string;
```

## Collections

The decorator works with any MongoDB collection in your database:

- `users` - User accounts
- `roles` - User roles
- `products` - Product catalog
- `categories` - Product categories
- `organizations` - Multi-tenant organizations
- Any custom collection you create

## Tips & Best Practices

1. **Always use ignoreField for updates**: Prevent false positives when updating records
2. **Use meaningful error messages**: Help users understand what went wrong
3. **Leverage where conditions**: Implement business rules at the validation level
4. **Use the builder pattern for complex rules**: More readable than nested options
5. **Consider performance**: Add database indexes for fields you're validating

## Common Patterns

### Soft Deletes
```typescript
@Unique('users', 'email', { 
    where: { deleted_at: null } 
})
```

### Status-based Uniqueness
```typescript
@Unique('users', 'username', { 
    where: { status: { $in: ['active', 'pending'] } } 
})
```

### Organization Scoped
```typescript
@Unique('users', 'email', { 
    where: { organization_id: 'current_org_id' } 
})
```

### Category Scoped
```typescript
@Unique('products', 'name', { 
    where: { category_id: 'current_category' } 
})
```
