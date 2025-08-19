import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { SavedJobsService } from './savedjobs.service';
import { SavedJobsEntity } from '../../../database/entities/savedjobs.entity';
import { UsersEntity } from '../../../database/entities/users.entity';
import { JobsEntity } from '../../../database/entities/jobs.entity';

class RepositoryMock {
  create = jest.fn();
  save = jest.fn();
  findOne = jest.fn();
  find = jest.fn();
  delete = jest.fn();
}

describe('SavedjobsService', () => {
  let service: SavedJobsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SavedJobsService,
        {
          provide: getRepositoryToken(SavedJobsEntity),
          useClass: RepositoryMock,
        },
        {
          provide: getRepositoryToken(UsersEntity),
          useClass: RepositoryMock,
        },
        {
          provide: getRepositoryToken(JobsEntity),
          useClass: RepositoryMock,
        },
      ],
    }).compile();

    service = module.get<SavedJobsService>(SavedJobsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
