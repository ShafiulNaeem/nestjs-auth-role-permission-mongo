import {
  registerDecorator,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
  ValidationArguments,
} from 'class-validator';
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Connection } from 'mongoose';
import { getModelToken } from '@nestjs/mongoose';
import { InjectConnection } from '@nestjs/mongoose';

@ValidatorConstraint({ async: true })
@Injectable()
export class ExistsConstraint implements ValidatorConstraintInterface {
  constructor(@InjectConnection() private readonly connection: Connection) {}

  async validate(value: any, args: ValidationArguments): Promise<boolean> {
    const [collectionName, field = '_id'] = args.constraints;

    const model = this.connection.collection(collectionName);
    const result = await model.findOne({ [field]: value });

    return !!result;
  }

  defaultMessage(args: ValidationArguments): string {
    const [collectionName, field = '_id'] = args.constraints;
    return `${field} does not exist in ${collectionName}`;
  }
}

export function Exists(collection: string, field: string = '_id', validationOptions?: ValidationOptions) {
  return function (object: any, propertyName: string) {
    registerDecorator({
      name: 'Exists',
      target: object.constructor,
      propertyName,
      options: validationOptions,
      constraints: [collection, field],
      validator: ExistsConstraint,
    });
  };
}
