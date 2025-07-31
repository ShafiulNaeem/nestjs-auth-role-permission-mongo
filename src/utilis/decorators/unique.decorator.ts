import {
    registerDecorator,
    ValidationOptions,
    ValidatorConstraint,
    ValidatorConstraintInterface,
    ValidationArguments,
} from 'class-validator';
import { Injectable } from '@nestjs/common';
import { InjectConnection } from '@nestjs/mongoose';
import { Connection} from 'mongoose';
import { ObjectId } from 'mongodb';

@ValidatorConstraint({ async: true })
@Injectable()
export class UniqueConstraint implements ValidatorConstraintInterface {
    constructor(@InjectConnection() private readonly connection: Connection) { }

    async validate(value: any, args: ValidationArguments): Promise<boolean> {
        const [collection, field, options] = args.constraints;
        const model = this.connection.collection(collection);

        const query: any = { [field]: value };

        if (options?.ignoreIdField && args.object[options.ignoreIdField]) {
            let ignoreId = args.object[options.ignoreIdField];

            // If ignoreId looks like a valid ObjectId string, cast it
            if (typeof ignoreId === 'string' && ObjectId.isValid(ignoreId)) {
                ignoreId = new ObjectId(ignoreId);
            }

            // Otherwise, leave as is (string or ObjectId)
            query._id = { $ne: ignoreId };
        }

        const existing = await model.findOne(query);
        return !existing;
    }


    defaultMessage(args: ValidationArguments): string {
        const [collection, field] = args.constraints;
        return `${field} must be unique in ${collection}`;
    }
}

export function Unique(
    collection: string,
    field: string,
    options?: { ignoreIdField?: string },
    validationOptions?: ValidationOptions,
) {
    return function (object: any, propertyName: string) {
        registerDecorator({
            name: 'Unique',
            target: object.constructor,
            propertyName,
            constraints: [collection, field, options],
            options: validationOptions,
            validator: UniqueConstraint,
        });
    };
}
