import { Test, TestingModule } from '@nestjs/testing';
import { CandidacyService } from './candidacy.service';
import { CandidacyRepository } from '../repository/candidacy.repository';

class CandidacyRepositoryMock {
  create = jest.fn();
  findOne = jest.fn();
  update = jest.fn();
}

describe('CandidacyService', () => {
  let service: CandidacyService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CandidacyService,
        {
          provide: CandidacyRepository,
          useClass: CandidacyRepositoryMock,
        },
      ],
    }).compile();

    service = module.get<CandidacyService>(CandidacyService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
