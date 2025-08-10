import { Injectable, Logger } from '@nestjs/common';
import { DataSource, QueryRunner } from 'typeorm';
import { StatusEnum } from '../../../shared/enums/status.enum';
import { JobRepository } from '../repository/job.repository';
import { IJobsResponse } from '../interfaces/interfaces';
import { CandidacyService } from '../../candidacy/service/candidacy.service';

@Injectable()
export class DeleteJobService {
  private readonly logger = new Logger(DeleteJobService.name);

  constructor(
    private jobRepository: JobRepository,
    private candidacyService: CandidacyService,
    private dataSource: DataSource,
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

    const queryRunner: QueryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Update job status to archived
      await queryRunner.manager.update('jobs', jobId, {
        status: StatusEnum.ARCHIVED,
        content: content,
      });

      // Update candidacies date closing
      const currentDate = new Date();
      await this.candidacyService.updateDateClosingByJobId(jobId, currentDate);

      await queryRunner.commitTransaction();

      this.logger.log(`Job ${jobId} archived successfully`);

      return {
        status: 200,
        data: {
          message: 'Job archived successfully',
        },
      };
    } catch (error) {
      await queryRunner.rollbackTransaction();

      this.logger.error(
        `Failed to archive job ${jobId}: ${error.message}`,
        error.stack,
        'DeleteJobService.execute',
      );

      return {
        status: 500,
        data: {
          message: 'Failed to archive job. Please try again.',
        },
      };
    } finally {
      await queryRunner.release();
    }
  }
}
