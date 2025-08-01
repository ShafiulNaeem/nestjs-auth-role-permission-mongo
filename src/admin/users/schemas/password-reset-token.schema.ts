import { Schema, Prop, SchemaFactory, } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type PasswordResetTokenDocument = PasswordResetToken & Document;

@Schema()
export class PasswordResetToken extends Document {

    @Prop({ type: Types.ObjectId, ref: 'User', default: null })
    userId?: Types.ObjectId;

    @Prop({ required: true, unique: true })
    email: string;

    @Prop({ default: true })
    url_or_otp: boolean;

    @Prop({ default: null })
    redirect_url?: string;

    @Prop({ required: true })
    token: string;

    @Prop({ default: null })
    createdAt?: Date;

    @Prop({ default: null })
    expiresAt?: Date;
}

export const PasswordResetTokenSchema = SchemaFactory.createForClass(PasswordResetToken);
