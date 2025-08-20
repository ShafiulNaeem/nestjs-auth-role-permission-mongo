import { AuthFacadeMiddleware } from '../middleware/auth-facade.middleware';

describe('AuthFacadeMiddleware', () => {
  it('should be defined', () => {
    expect(new AuthFacadeMiddleware()).toBeDefined();
  });
});
