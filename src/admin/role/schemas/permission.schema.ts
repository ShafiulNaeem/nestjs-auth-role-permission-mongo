import { Schema, Prop, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type PermissionDocument = Permission & Document;


@Schema({ timestamps: true })
export class Permission extends Document {
    @Prop({ required: true })
    subject: string;

    @Prop({ required: true })
    action: string;

    @Prop({ default: null })
    description?: string;

    // One-to-Many: Permission belongs to one role
    @Prop({ type: Types.ObjectId, ref: 'Role', required: true })
    roleId: Types.ObjectId;

}

export const PermissionSchema = SchemaFactory.createForClass(Permission);