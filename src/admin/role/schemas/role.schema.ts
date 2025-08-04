import { Schema, Prop, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type RoleDocument = Role & Document;


@Schema({ timestamps: true })
export class Role extends Document {
    @Prop({ required: true, index: true })
    name: string;

    @Prop({ default: false })
    is_manage_all: boolean;


    @Prop({ default: null })
    guard_name?: string;

}

export const RoleSchema = SchemaFactory.createForClass(Role);
