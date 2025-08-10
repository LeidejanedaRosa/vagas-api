import { Injectable, Logger } from '@nestjs/common';
import { DataSource, QueryRunner, Not } from 'typeorm';
import { StatusEnum } from '../../../shared/enums/status.enum';
import { JobRepository } from '../repository/job.repository';
import { IJobsResponse } from '../interfaces/interfaces';
import { CandidacyService } from '../../candidacy/service/candidacy.service';
import { JobsEntity } from '../../../database/entities/jobs.entity';

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
      const updateResult = await queryRunner.manager
        .getRepository(JobsEntity)
        .update(
          {
            id: jobId,
            status: Not(StatusEnum.ARCHIVED),
          },
          {
            status: StatusEnum.ARCHIVED,
            content: content,
          },
        );

      if (updateResult.affected === 0) {
        await queryRunner.rollbackTransaction();
        this.logger.warn(
          `Job ${jobId} was not found or already archived during archive operation`,
        );

        return {
          status: 404,
          data: {
            message: 'Job could not be found or was already archived',
          },
        };
      }

      const currentDate = new Date();
      await this.candidacyService.updateDateClosingByJobId(
        jobId,
        currentDate,
        queryRunner.manager,
      );

      await queryRunner.commitTransaction();

      this.logger.log(
        `Job ${jobId} archived successfully (idempotent operation)`,
      );

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
