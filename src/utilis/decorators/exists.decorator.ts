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

export interface ExistsValidationOptions {
  /**
   * Custom error message
   */
  message?: string;
  /**
   * Additional conditions for the query
   */
  where?: Record<string, any>;
  /**
   * Whether to convert string values to ObjectId when checking _id field
   */
  convertToObjectId?: boolean;
}

@ValidatorConstraint({ async: true })
@Injectable()
export class ExistsConstraint implements ValidatorConstraintInterface {
  constructor(@InjectConnection() private readonly connection: Connection) { }

  async validate(value: any, args: ValidationArguments): Promise<boolean> {
    try {
      const [collection, field, options] = args.constraints as [string, string, ExistsValidationOptions?];

      if (!this.connection) {
        console.error('Database connection is not available');
        return false;
      }

      if (!value) {
        return false; // Don't validate empty values
      }

      const model = this.connection.collection(collection);

      // Build the base query
      let queryValue = value;

      // Handle ObjectId conversion for _id field
      if ((field === '_id' || options?.convertToObjectId) &&
        typeof value === 'string' &&
        ObjectId.isValid(value)) {
        queryValue = new ObjectId(value);
      }

      const query: any = { [field]: queryValue };

      // Add additional where conditions if provided
      if (options?.where) {
        Object.assign(query, options.where);
      }

      const result = await model.findOne(query);
      return !!result;
    } catch (error) {
      console.error('Exists validation error:', error);
      return false;
    }
  }

  defaultMessage(args: ValidationArguments): string {
    const [collection, field, options] = args.constraints as [string, string, ExistsValidationOptions?];

    if (options?.message) {
      return options.message;
    }

    return `The selected ${field} does not exist.`;
  }
}

/**
 * Exists validation decorator - Works like Laravel's exists validation rule
 * 
 * @param collection - The MongoDB collection name to check against
 * @param field - The field name to check for existence (defaults to '_id')
 * @param options - Additional validation options
 * @param validationOptions - Class-validator options
 * 
 * @example
 * // Basic usage - check if ID exists
 * @Exists('users')
 * userId: string;
 * 
 * @example
 * // Check custom field
 * @Exists('users', 'email')
 * userEmail: string;
 * 
 * @example
 * // With additional conditions
 * @Exists('users', '_id', { 
 *   where: { status: 'active' },
 *   message: 'User must be active'
 * })
 * userId: string;
 * 
 * @example
 * // Convert string to ObjectId for _id field
 * @Exists('users', '_id', { convertToObjectId: true })
 * userId: string;
 */
export function Exists(
  collection: string,
  field: string = '_id',
  options?: ExistsValidationOptions,
  validationOptions?: ValidationOptions
) {
  return function (object: any, propertyName: string) {
    registerDecorator({
      name: 'exists',
      target: object.constructor,
      propertyName,
      options: validationOptions,
      constraints: [collection, field, options],
      validator: ExistsConstraint,
    });
  };
}

/**
 * Laravel-like exists rule builder for more complex scenarios
 * 
 * @example
 * @ExistsRule('users').where('status', 'active').message('User must be active')
 * userId: string;
 */
export class ExistsRuleBuilder {
  private collection: string;
  private field: string;
  private options: ExistsValidationOptions = {};

  constructor(collection: string, field: string = '_id') {
    this.collection = collection;
    this.field = field;
  }

  /**
   * Add a where condition to the existence check
   */
  where(field: string, value: any): ExistsRuleBuilder {
    if (!this.options.where) {
      this.options.where = {};
    }
    this.options.where[field] = value;
    return this;
  }

  /**
   * Set a custom error message
   */
  message(message: string): ExistsRuleBuilder {
    this.options.message = message;
    return this;
  }

  /**
   * Enable ObjectId conversion for string values
   */
  convertToObjectId(): ExistsRuleBuilder {
    this.options.convertToObjectId = true;
    return this;
  }

  /**
   * Build the decorator
   */
  build(validationOptions?: ValidationOptions) {
    return Exists(this.collection, this.field, this.options, validationOptions);
  }
}

/**
 * Laravel-like exists rule builder
 * 
 * @param collection - The MongoDB collection name
 * @param field - The field name (optional, defaults to '_id')
 */
export function ExistsRule(collection: string, field: string = '_id'): ExistsRuleBuilder {
  return new ExistsRuleBuilder(collection, field);
}
