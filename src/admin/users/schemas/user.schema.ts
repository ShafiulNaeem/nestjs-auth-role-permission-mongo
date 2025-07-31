import { Schema, Prop, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({ timestamps: true })
export class User extends Document {
    @Prop({ required: true, index: true })
    name: string;

    @Prop({ required: true, unique: true, index: true })
    email: string;

    @Prop({ default: null })
    email_verified_at?: Date;

    @Prop({ required: true })
    password: string;

    @Prop({ default: null })
    image: string;

    @Prop({ default: 0 })
    accuracy: number;

    @Prop()
    remember_token?: string;

    @Prop({ type: Types.ObjectId, ref: 'User', default: null })
    created_by?: Types.ObjectId;

    @Prop({ type: Types.ObjectId, ref: 'User', default: null })
    updated_by?: Types.ObjectId;

    @Prop()
    last_login_at?: Date;

    @Prop({ default: null })
    deletedAt?: Date; // Simulate soft delete manually
}

export const UserSchema = SchemaFactory.createForClass(User);
