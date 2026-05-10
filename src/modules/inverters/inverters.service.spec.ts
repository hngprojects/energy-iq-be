import { Test, TestingModule } from '@nestjs/testing';
import { InvertersService } from './inverters.service';

describe('InvertersService', () => {
  let service: InvertersService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [InvertersService],
    }).compile();

    service = module.get<InvertersService>(InvertersService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
