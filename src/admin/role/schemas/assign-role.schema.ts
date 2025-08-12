import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types, Model } from 'mongoose';
import aggregatePaginate = require('mongoose-aggregate-paginate-v2');
import { AggregatePaginateModel, AggregatePaginateResult } from '../../../utilis/interfaces/aggregate-paginate.interfaces';

@Schema({
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
})
export class AssignRole {
  @Prop({ type: Types.ObjectId, ref: 'Role', required: true })
  roleId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId: Types.ObjectId;
}

// export type AssignRoleDocument = HydratedDocument<AssignRole>;
export type AssignRoleDocument = AssignRole & Document;
export type AssignRoleModel = AggregatePaginateModel<AssignRole>;

export const AssignRoleSchema = SchemaFactory.createForClass(AssignRole);

// Virtual: role.permissions -> all permissions with this role
AssignRoleSchema.virtual('permissions', {
  ref: 'Permission',
  localField: 'roleId',
  foreignField: 'roleId',
});

AssignRoleSchema.virtual('role', {
  ref: 'Role',
  localField: 'roleId',
  foreignField: '_id',
  justOne: true,
});


AssignRoleSchema.virtual('user', {
  ref: 'User',
  localField: 'userId',
  foreignField: '_id',
  justOne: true,
});

AssignRoleSchema.plugin(aggregatePaginate);
