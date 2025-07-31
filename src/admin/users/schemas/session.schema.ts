import { Schema, Prop, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema()
export class Session extends Document {
    @Prop({ required: true })
    id: string;

    @Prop({ type: Types.ObjectId, ref: 'User', default: null, index: true })
    user_id?: Types.ObjectId;

    @Prop({ maxlength: 45 })
    ip_address?: string;

    @Prop()
    user_agent?: string;

    @Prop({ required: true })
    payload: string;

    @Prop({ required: true, index: true })
    last_activity: number;
}

export const SessionSchema = SchemaFactory.createForClass(Session);
