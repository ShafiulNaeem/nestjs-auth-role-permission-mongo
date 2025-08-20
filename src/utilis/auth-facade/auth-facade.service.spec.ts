import { Test, TestingModule } from '@nestjs/testing';
import { AuthFacadeService } from './auth-facade.service';

describe('AuthFacadeService', () => {
  let service: AuthFacadeService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AuthFacadeService],
    }).compile();

    service = module.get<AuthFacadeService>(AuthFacadeService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
