import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { Repository } from 'typeorm';
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

      if (status !== CandidacyStatus.InProgress) {
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
    try {
      return await this.candidacyRepository.find({
        where: { jobId: jobId },
      });
    } catch (error) {
      throw new InternalServerErrorException(
        'Erro ao buscar candidaturas por jobId: ' + error.message,
      );
    }
  }

  async updateDateClosing(jobId: string, dateClosing: Date): Promise<void> {
    try {
      await this.candidacyRepository.update(
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
