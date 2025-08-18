import { Schema, Prop, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import * as mongoosePaginate from 'mongoose-paginate-v2';

export type UserDocument = User & Document;

/**
 * User Schema
 * This schema defines the structure of the user document in the MongoDB database.
 * It includes fields for user details such as name, email, password, status, and timestamps.
 */

@Schema({
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
})
export class User extends Document {
  @Prop({ default: null, index: true })
  name: string;

  @Prop({ required: true, unique: true, index: true })
  email: string;

  @Prop({ default: null })
  email_verified_at?: Date;

  @Prop({ default: null })
  password: string;

  @Prop({ default: true })
  status: boolean;

  @Prop({ default: null })
  image: string;

  @Prop({ default: null })
  remember_token?: string;

  @Prop({ default: null })
  refreshTokenHash: string; 

  @Prop({ type: Types.ObjectId, ref: 'User', default: null })
  created_by?: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', default: null })
  updated_by?: Types.ObjectId;

  @Prop({ default: null })
  last_login_at?: Date;

  @Prop({ default: null })
  deletedAt?: Date; // Simulate soft delete manually

  @Prop({ default: null })
  provider?: 'google'|'facebook'|'github'|'twitter'|'linkedin';

  @Prop({ default: null })
  providerId?: string;

  @Prop({ default: null })
  identities?: Array<{
    provider: 'google'|'facebook'|'github'|'twitter'|'linkedin';
    providerId: string;
    email?: string | null;
    name?: string | null;
    image?: string | null;
  }>;
}

export const UserSchema = SchemaFactory.createForClass(User);
// define relationships
UserSchema.virtual('assignRole', {
  ref: 'AssignRole',
  localField: '_id',
  foreignField: 'userId',
  justOne: true,
});

UserSchema.plugin(mongoosePaginate);
