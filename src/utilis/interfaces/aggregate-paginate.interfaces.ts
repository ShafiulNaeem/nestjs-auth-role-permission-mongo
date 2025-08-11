import { Model } from 'mongoose';

export interface AggregatePaginateResult<T> {
  docs: T[];
  totalDocs: number;
  limit: number;
  page?: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
  nextPage?: number;
  prevPage?: number;
  pagingCounter?: number;
  meta?: any;
}

export interface AggregatePaginateModel<T> extends Model<T> {
  aggregatePaginate(
    aggregate: any,
    options: any,
    callback?: (err: any, result: AggregatePaginateResult<T>) => void
  ): Promise<AggregatePaginateResult<T>>;
}
