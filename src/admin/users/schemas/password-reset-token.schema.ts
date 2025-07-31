import { Schema, Prop, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema()
export class PasswordResetToken extends Document {
    @Prop({ required: true, unique: true })
    email: string;

    @Prop({ default: true })
    url_or_otp: boolean;

    @Prop({ required: true })
    token: string;

    @Prop({ default: null })
    created_at?: Date;

    @Prop({ default: null })
    expires_at?: Date;
}

export const PasswordResetTokenSchema = SchemaFactory.createForClass(PasswordResetToken);
