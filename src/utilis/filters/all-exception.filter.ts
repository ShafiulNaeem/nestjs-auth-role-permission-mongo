import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';

@Catch()
export class AllExceptionFilter implements ExceptionFilter {
  catch(exception: any, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();
    const request = ctx.getRequest();

    // Default status
    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error';
    let errors = null;

    // If it's an HttpException (manually thrown)
    if (exception instanceof HttpException) {
      const exceptionResponse = exception.getResponse();

      if (typeof exceptionResponse === 'object' && exceptionResponse !== null) {
        const res = exceptionResponse as any;

        status = exception.getStatus();
        message = res.message || message;
        errors = res.errors || null;
      } else {
        // If exception response is string
        status = exception.getStatus();
        message = exceptionResponse as string;
      }
    }

    // Mongoose validation error (or similar custom error objects)
    else if (exception.name === 'ValidationError') {
      status = HttpStatus.UNPROCESSABLE_ENTITY;
      message = 'Validation failed';
      errors = Object.keys(exception.errors).reduce((acc: any, key: string) => {
        acc[key] = exception.errors[key].message;
        return acc;
      }, {});
    }

    // Any other error with a message
    else if (exception.message) {
      message = exception.message;
    }

    // Final formatted response
    response.status(status).json({
      statusCode: status,
      message,
      errors,
      path: request.url,
      timestamp: new Date().toISOString(),
    });
  }
}
