import { ValidationPipe, ValidationError, BadRequestException, UnprocessableEntityException } from '@nestjs/common';

export class KeyValueValidationPipe extends ValidationPipe {
  protected flattenValidationErrors(validationErrors: ValidationError[]): any {
    const errors: Record<string, string> = {};
    validationErrors.forEach((error) => {
      if (error.constraints) {
        // Only take the first constraint message for each field
        errors[error.property] = Object.values(error.constraints)[0];
      }
    });
    return errors;
  }

  public createExceptionFactory() {
    return (validationErrors: ValidationError[] = []) => {
      const errors = this.flattenValidationErrors(validationErrors);
      return new UnprocessableEntityException({
        message: "Validation Error",
        error: 'Unprocessable Entity',
        statusCode: 422,
        errors: errors
      });
    };
  }
}
