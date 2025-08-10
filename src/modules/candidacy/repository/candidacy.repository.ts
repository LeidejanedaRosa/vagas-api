import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { Repository, EntityManager } from 'typeorm';
import { CandidacyEntity } from '../../../database/entities/candidacy.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { CandidacyStatus } from 'src/database/entities/candidancy-status.enum';

@Injectable()
export class CandidacyRepository {
  constructor(
    @InjectRepository(CandidacyEntity)
    private candidacyRepository: Repository<CandidacyEntity>,
  ) {}

  async createCandidacy(candidacy: CandidacyEntity): Promise<CandidacyEntity> {
    return this.candidacyRepository.save(candidacy);
  }

  async findAllByUserId(userId: string): Promise<CandidacyEntity[]> {
    if (!userId) {
      throw new BadRequestException('userId é obrigatório');
    }
    try {
      const candidacy = await this.candidacyRepository.find({
        where: { userId: userId },
      });
      if (!candidacy.length) {
        throw new NotFoundException(
          'Nenhuma candidatura encontrada para este usuário',
        );
      }
      return candidacy;
    } catch (error) {
      throw new BadRequestException(
        'Erro ao buscar candidaturas: ' + error.message,
      );
    }
  }

  async updateStatus(
    id: string,
    status: CandidacyStatus,
  ): Promise<CandidacyEntity | null> {
    try {
      const candidacy = await this.candidacyRepository.findOne({
        where: { id },
      });
      if (!candidacy) {
        throw new NotFoundException('Candidatura não encontrada');
      }

      candidacy.status = status;

      if (status !== CandidacyStatus.InProgress && !candidacy.dateClosing) {
        candidacy.dateClosing = new Date();
      }

      await this.candidacyRepository.save(candidacy);

      return candidacy;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      } else {
        throw new InternalServerErrorException(
          'Erro ao atualizar o status da candidatura: ' + error.message,
        );
      }
    }
  }

  async findAllByJobId(jobId: string): Promise<CandidacyEntity[]> {
    if (!jobId) {
      throw new BadRequestException('jobId é obrigatório');
    }
    try {
      const candidacies = await this.candidacyRepository.find({
        where: { jobId: jobId },
      });
      if (!candidacies.length) {
        throw new NotFoundException(
          'Nenhuma candidatura encontrada para esta vaga',
        );
      }
      return candidacies;
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      throw new InternalServerErrorException(
        'Erro ao buscar candidaturas por jobId: ' + error.message,
      );
    }
  }

  async updateDateClosing(
    jobId: string,
    dateClosing: Date,
    entityManager?: EntityManager,
  ): Promise<void> {
    try {
      const repository = entityManager
        ? entityManager.getRepository(CandidacyEntity)
        : this.candidacyRepository;

      await repository.update(
        {
          jobId: jobId,
          status: CandidacyStatus.InProgress,
        },
        {
          dateClosing: dateClosing,
          status: CandidacyStatus.Closed,
        },
      );
    } catch (error) {
      throw new InternalServerErrorException(
        'Erro ao atualizar dateClosing e status das candidaturas: ' +
          error.message,
      );
    }
  }
}
