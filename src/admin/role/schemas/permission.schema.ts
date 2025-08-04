import { Schema, Prop, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type PermissionDocument = Permission & Document;


@Schema({ timestamps: true })
export class Permission extends Document {
    @Prop({ type: Types.ObjectId, ref: 'Role', required: true })
    roleId: Types.ObjectId;

    @Prop({ required: true })
    subject: string;

    @Prop({ required: true })
    action: string;

}

export const PermissionSchema = SchemaFactory.createForClass(Permission);