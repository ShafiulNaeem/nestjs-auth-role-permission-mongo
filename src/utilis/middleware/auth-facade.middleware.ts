import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { Auth } from 'src/utilis/auth-facade/auth';

@Injectable()
export class AuthFacadeMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    Auth.setRequest(req);
    next();
  }
}
