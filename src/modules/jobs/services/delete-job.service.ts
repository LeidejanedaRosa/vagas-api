import { Injectable } from '@nestjs/common';
import { StatusEnum } from '../../../shared/enums/status.enum';
import { JobRepository } from '../repository/job.repository';
import { IJobsResponse } from '../interfaces/interfaces';
import { CandidacyService } from '../../candidacy/service/candidacy.service';

@Injectable()
export class DeleteJobService {
  constructor(
    private jobRepository: JobRepository,
    private candidacyService: CandidacyService,
  ) {}

  async execute(jobId: string, content: string): Promise<IJobsResponse> {
    const jobExists = await this.jobRepository.findOneById(jobId);

    if (!jobExists) {
      return {
        status: 404,
        data: {
          message: 'Job could not be found',
        },
      };
    }

    jobExists.status = StatusEnum.ARCHIVED;
    jobExists.content = content;

    // Atualizar apenas os campos necessários
    await this.jobRepository.updateJob(jobId, {
      status: StatusEnum.ARCHIVED,
      content: content,
    });

    // Atualizar dateClosing e status das candidaturas relacionadas à vaga
    const currentDate = new Date();
    try {
      await this.candidacyService.updateDateClosingByJobId(jobId, currentDate);
    } catch (error) {
      // Log do erro mas não falha o arquivamento da vaga
      console.error(
        'Erro ao atualizar dateClosing e status das candidaturas:',
        error,
      );
    }

    return {
      status: 200,
      data: {
        message: 'Job archived successfully',
      },
    };
  }
}
