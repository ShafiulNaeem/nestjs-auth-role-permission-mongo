// success-response.interceptor.ts
import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable, map } from 'rxjs';

@Injectable()
export class SuccessResponseInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const ctx = context.switchToHttp();
    const request = ctx.getRequest();

    return next.handle().pipe(
      map((data) => {
        return {
          statusCode: data?.statusCode || 200,
          message: data?.message || 'Success',
          data: data?.data ?? data, // preserve original data
          path: request.url,
          timestamp: new Date().toISOString(),
        };
      }),
    );
  }
}
