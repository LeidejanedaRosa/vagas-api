import { Injectable } from '@nestjs/common';
import { CompanyRepository } from 'src/modules/company/repository/company.repository';
import { IJobsResponse } from '../interfaces/interfaces';
import { JobRepository } from '../repository/job.repository';

@Injectable()
export class GetAllJobsFromLoggedCompanyService {
  constructor(
    private companyRepository: CompanyRepository,
    private jobsRepository: JobRepository,
  ) {}

  async execute(companyId: string): Promise<IJobsResponse> {
    const jobs = await this.jobsRepository.getAllJobsByCompanyId(companyId);

    if (!jobs || jobs.length === 0) {
      return {
        status: 200,
        data: {
          message: 'Logged company jobs listed successfully.',
          content: [],
        },
      };
    }

    return {
      status: 200,
      data: {
        message: 'Logged company jobs listed successfully.',
        content: jobs,
      },
    };
  }
}
