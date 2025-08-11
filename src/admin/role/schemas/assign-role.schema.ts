
// import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
// import { HydratedDocument, Types, Model } from 'mongoose';
// import aggregatePaginate from 'mongoose-aggregate-paginate-v2';
// // If you don't have a shared type, you can keep this local:
// export interface AggregatePaginateResult<T> {
//   docs: T[]; totalDocs: number; limit: number; page?: number; totalPages: number;
//   hasNextPage: boolean; hasPrevPage: boolean; nextPage?: number; prevPage?: number;
// }
// export interface AggregatePaginateModel<T> extends Model<T> {
//   aggregatePaginate(agg: any, options: any): Promise<AggregatePaginateResult<T>>;
// }

// @Schema({ timestamps: true })
// export class AssignRole {
//   @Prop({ type: Types.ObjectId, ref: 'Role', required: true })
//   roleId: Types.ObjectId;

//   @Prop({ type: Types.ObjectId, ref: 'User', required: true })
//   userId: Types.ObjectId;
// }

// export type AssignRoleDocument = HydratedDocument<AssignRole>;
// export type AssignRoleModel = AggregatePaginateModel<AssignRole>;

// export const AssignRoleSchema = SchemaFactory.createForClass(AssignRole);
// AssignRoleSchema.plugin(aggregatePaginate);
