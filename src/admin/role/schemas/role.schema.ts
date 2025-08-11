import { Schema, Prop, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import * as mongoosePaginate from 'mongoose-paginate-v2';

export type RoleDocument = Role & Document;


@Schema({
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
})
export class Role extends Document {
    @Prop({ required: true, index: true })
    name: string;

    @Prop({ default: false })
    is_manage_all: boolean;

    @Prop({ default: null })
    guard_name?: string;

}

export const RoleSchema = SchemaFactory.createForClass(Role);

// Virtual: role.permissions -> all permissions with this role
RoleSchema.virtual('permissions', {
  ref: 'Permission',
  localField: '_id',
  foreignField: 'roleId',
});

// ✅ Add pagination plugin here
RoleSchema.plugin(mongoosePaginate);
