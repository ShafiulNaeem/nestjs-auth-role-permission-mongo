import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';
import { ApiSuccessResponse } from './utilis/interfaces/api-success-response.interface';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) { }

  @Get()
  getHello(): any {
    try {
      // Simulate some service logic
      const data = this.appService.getHello();
      return {
        statusCode: 200,
        message: 'Success',
        data: data,
      } as ApiSuccessResponse;
    }
    catch (error) {
      // Handle any errors that might occur
      throw new Error('An error occurred while processing your request.');
    }
  }
}
