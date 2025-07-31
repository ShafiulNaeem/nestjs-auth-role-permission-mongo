import { Schema, Prop, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type UserDocument = User & Document;

/**
 * User Schema
 * This schema defines the structure of the user document in the MongoDB database.
 * It includes fields for user details such as name, email, password, status, and timestamps.
 */

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

    @Prop({ default: true })
    status: boolean;

    @Prop({ default: null })
    image: string;

    @Prop({ default: null })
    remember_token?: string;

    @Prop({ type: Types.ObjectId, ref: 'User', default: null })
    created_by?: Types.ObjectId;

    @Prop({ type: Types.ObjectId, ref: 'User', default: null })
    updated_by?: Types.ObjectId;

    @Prop({ default: null })
    last_login_at?: Date;

    @Prop({ default: null })
    deletedAt?: Date; // Simulate soft delete manually
}

export const UserSchema = SchemaFactory.createForClass(User);
