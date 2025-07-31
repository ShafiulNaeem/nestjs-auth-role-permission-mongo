import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { AllExceptionFilter } from './utilis/filters/all-exception.filter';
import { SuccessResponseInterceptor } from './utilis/interceptors/success-respose.interceptor';
import { Reflector } from '@nestjs/core';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Apply filter
  app.useGlobalFilters(new AllExceptionFilter());

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
