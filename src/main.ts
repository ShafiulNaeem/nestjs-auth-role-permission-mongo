import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { AllExceptionFilter } from './utilis/filters/all-exception.filter';
import { SuccessResponseInterceptor } from './utilis/interceptors/success-respose.interceptor';
import { Reflector } from '@nestjs/core';
import { VersioningType, ValidationPipe } from '@nestjs/common';
import { useContainer } from 'class-validator';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Configure class-validator to use NestJS's dependency injection container
  useContainer(app.select(AppModule), { fallbackOnErrors: true });

  // Set global prefix for API routes
  app.setGlobalPrefix('api');
  // Enable versioning for the API
  app.enableVersioning({
    type: VersioningType.URI,
  });

  // Apply filter
  app.useGlobalFilters(new AllExceptionFilter());

  // validation pipe
  app.useGlobalPipes(new ValidationPipe());
  // Apply global interceptors
  app.useGlobalInterceptors({
    intercept(context, next) {
      const ctx = context.switchToHttp();
      const request = ctx.getRequest();

      if (request.url.startsWith('/api')) {
        return new SuccessResponseInterceptor().intercept(context, next);
      }
      return next.handle();
    },
  });

  await app.listen(process.env.APP_PORT ?? 3000);
}
bootstrap();
