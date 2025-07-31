import {
    registerDecorator,
    ValidationOptions,
    ValidatorConstraint,
    ValidatorConstraintInterface,
    ValidationArguments,
} from 'class-validator';
import { Injectable } from '@nestjs/common';
import { InjectConnection } from '@nestjs/mongoose';
import { Connection } from 'mongoose';
import { ObjectId } from 'mongodb';

export interface UniqueValidationOptions {
    /**
     * Field to ignore when checking uniqueness (usually for updates)
     */
    ignoreField?: string;
    /**
     * Custom error message
     */
    message?: string;
    /**
     * Additional conditions for the query
     */
    where?: Record<string, any>;
}

@ValidatorConstraint({ async: true })
@Injectable()
export class UniqueConstraint implements ValidatorConstraintInterface {
    constructor(@InjectConnection() private readonly connection: Connection) { }

    async validate(value: any, args: ValidationArguments): Promise<boolean> {
        try {
            const [collection, field, options] = args.constraints as [string, string, UniqueValidationOptions?];

            if (!this.connection) {
                console.error('Database connection is not available');
                return false;
            }

            const model = this.connection.collection(collection);

            // Build the base query
            const query: any = { [field]: value };

            // Add additional where conditions if provided
            if (options?.where) {
                Object.assign(query, options.where);
            }

            // Handle ignore field for updates (typically ignoring current record's ID)
            if (options?.ignoreField && args.object[options.ignoreField]) {
                let ignoreValue = args.object[options.ignoreField];

                // If ignoreValue looks like a valid ObjectId string, cast it
                if (typeof ignoreValue === 'string' && ObjectId.isValid(ignoreValue)) {
                    ignoreValue = new ObjectId(ignoreValue);
                }

                // Exclude the current record from uniqueness check
                query._id = { $ne: ignoreValue };
            }

            const existing = await model.findOne(query);
            return !existing;
        } catch (error) {
            console.error('Unique validation error:', error);
            return false;
        }
    }

    defaultMessage(args: ValidationArguments): string {
        const [collection, field, options] = args.constraints as [string, string, UniqueValidationOptions?];

        if (options?.message) {
            return options.message;
        }

        return `The ${field} has already been taken.`;
    }
}

/**
 * Unique validation decorator - Works like Laravel's unique validation rule
 * 
 * @param collection - The MongoDB collection name to check against
 * @param field - The field name to check for uniqueness (defaults to property name)
 * @param options - Additional validation options
 * @param validationOptions - Class-validator options
 * 
 * @example
 * // Basic usage
 * @Unique('users')
 * email: string;
 * 
 * @example
 * // With custom field name
 * @Unique('users', 'email_address')
 * email: string;
 * 
 * @example
 * // For updates (ignore current record)
 * @Unique('users', 'email', { ignoreField: 'id' })
 * email: string;
 * 
 * @example
 * // With additional conditions
 * @Unique('users', 'username', { 
 *   where: { status: 'active' },
 *   message: 'This username is already taken by an active user'
 * })
 * username: string;
 */
export function Unique(
    collection: string,
    field?: string,
    options?: UniqueValidationOptions,
    validationOptions?: ValidationOptions,
) {
    return function (object: any, propertyName: string) {
        registerDecorator({
            name: 'unique',
            target: object.constructor,
            propertyName,
            constraints: [collection, field || propertyName, options],
            options: validationOptions,
            validator: UniqueConstraint,
        });
    };
}

/**
 * Laravel-like unique rule builder for more complex scenarios
 * 
 * @example
 * @UniqueRule('users').where('status', 'active').ignore('id')
 * email: string;
 */
export class UniqueRuleBuilder {
    private collection: string;
    private field?: string;
    private options: UniqueValidationOptions = {};

    constructor(collection: string, field?: string) {
        this.collection = collection;
        this.field = field;
    }

    /**
     * Add a where condition to the uniqueness check
     */
    where(field: string, value: any): UniqueRuleBuilder {
        if (!this.options.where) {
            this.options.where = {};
        }
        this.options.where[field] = value;
        return this;
    }

    /**
     * Ignore a field when checking uniqueness (typically for updates)
     */
    ignore(field: string): UniqueRuleBuilder {
        this.options.ignoreField = field;
        return this;
    }

    /**
     * Set a custom error message
     */
    message(message: string): UniqueRuleBuilder {
        this.options.message = message;
        return this;
    }

    /**
     * Build the decorator
     */
    build(validationOptions?: ValidationOptions) {
        return Unique(this.collection, this.field, this.options, validationOptions);
    }
}

/**
 * Laravel-like unique rule builder
 * 
 * @param collection - The MongoDB collection name
 * @param field - The field name (optional, defaults to property name)
 */
export function UniqueRule(collection: string, field?: string): UniqueRuleBuilder {
    return new UniqueRuleBuilder(collection, field);
}
