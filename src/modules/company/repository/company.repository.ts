import { Injectable, NotFoundException } from '@nestjs/common';
import { CompaniesEntity } from '../../../database/entities/companies.entity';
import {
  PageDto,
  PageMetaDto,
  PageOptionsDto,
} from '../../../shared/pagination';
import { Repository } from 'typeorm';
import { handleError } from '../../../shared/utils/handle-error.util';
import { CreateCompanyDto } from '../dtos/create-company.dto';
import { UpdateMyPasswordDto } from '../dtos/update-my-password.dto';
import { InjectRepository } from '@nestjs/typeorm';

@Injectable()
export class CompanyRepository {
  constructor(
    @InjectRepository(CompaniesEntity)
    private companyRepository: Repository<CompaniesEntity>,
  ) {}

  async createCompany(data: CreateCompanyDto): Promise<CompaniesEntity> {
    delete data.passwordConfirmation;
    return this.companyRepository.save(data).catch(handleError);
  }

  async findAllCompany(
    pageOptionsDto: PageOptionsDto,
  ): Promise<PageDto<CompaniesEntity>> {
    const queryBuilder = this.companyRepository.createQueryBuilder('companies');

    queryBuilder
      .orderBy(
        `companies.${pageOptionsDto.orderByColumn}`,
        pageOptionsDto.order,
      )
      .skip((pageOptionsDto.page - 1) * pageOptionsDto.take)
      .take(pageOptionsDto.take);

    const itemCount = await queryBuilder.getCount().catch(handleError);
    const { entities } = await queryBuilder.getRawAndEntities();

    const pageMetaDto = new PageMetaDto({ itemCount, pageOptionsDto });

    return new PageDto(entities, pageMetaDto);
  }

  async findCompanyById(id: string): Promise<CompaniesEntity> {
    if (!id) {
      throw new NotFoundException('Invalid company ID');
    }
    const company = await this.companyRepository
      .findOneBy({ id })
      .catch(handleError);

    if (!company) {
      throw new NotFoundException('Company not found');
    }

    return company;
  }

  async updateCompanyById(
    id: string,
    data: Partial<CompaniesEntity>,
  ): Promise<CompaniesEntity> {
    const company = await this.companyRepository.findOneBy({ id });

    if (!company) {
      throw new NotFoundException('Company not found');
    }

    await this.companyRepository.update(id, data).catch(handleError);
    return this.companyRepository.findOneBy({ id }).catch(handleError);
  }

  async findOneByEmail(email: string): Promise<CompaniesEntity> {
    return this.companyRepository.findOneBy({ email }).catch(handleError);
  }

  async findByToken(recoverPasswordToken: string): Promise<CompaniesEntity> {
    return this.companyRepository
      .findOneBy({ recoverPasswordToken })
      .catch(handleError);
  }

  async findOneById(id: string): Promise<CompaniesEntity> {
    return this.companyRepository.findOneBy({ id }).catch(handleError);
  }

  async findOneByCnpj(cnpj: string): Promise<CompaniesEntity> {
    return this.companyRepository.findOneBy({ cnpj }).catch(handleError);
  }

  async updateMyPassword(
    updateMyPasswordDto: UpdateMyPasswordDto,
    id: CompaniesEntity['id'],
  ): Promise<CompaniesEntity> {
    const company = await this.companyRepository
      .findOneBy({ id })
      .catch(handleError);

    if (!company) {
      throw new NotFoundException('Company not found');
    }

    await this.companyRepository
      .update(id, updateMyPasswordDto)
      .catch(handleError);

    const updatedCompany = await this.companyRepository
      .findOneBy({ id })
      .catch(handleError);

    if (!updatedCompany) {
      throw new NotFoundException('Company not found after update');
    }

    return updatedCompany;
  }

  async updateRecoveryPassword(
    id: string,
    recoverPasswordToken: string,
  ): Promise<CompaniesEntity> {
    const company = await this.companyRepository
      .findOneBy({ id })
      .catch(handleError);

    if (!company) {
      throw new NotFoundException('Company not found');
    }

    company.recoverPasswordToken = recoverPasswordToken;

    return await this.companyRepository.save(company).catch(handleError);
  }

  async updateCompany(company: CompaniesEntity): Promise<CompaniesEntity> {
    return this.companyRepository
      .save(company)
      .then(() => this.findOneById(company.id))
      .catch(handleError);
  }

  async activateCompany(id: string): Promise<CompaniesEntity> {
    const company = await this.companyRepository
      .findOneBy({ id })
      .catch(handleError);

    if (!company) {
      throw new NotFoundException('Company not found');
    }

    company.mailConfirm = true;

    return await this.companyRepository.save(company).catch(handleError);
  }

  async updatePassword(id: string, password: string): Promise<CompaniesEntity> {
    const company = await this.companyRepository
      .findOneBy({ id })
      .catch(handleError);

    if (!company) {
      throw new NotFoundException('Company not found');
    }

    const updateData = {
      recoverPasswordToken: null,
      password,
    };

    await this.companyRepository.update(id, updateData).catch(handleError);

    return this.companyRepository.findOneBy({ id }).catch(handleError);
  }

  async deleteCompanyById(id: string): Promise<object> {
    const company = await this.companyRepository
      .findOneBy({ id })
      .catch(handleError);

    if (!company) {
      throw new NotFoundException('Company not found');
    }

    await this.companyRepository.delete(id).catch(handleError);

    return { message: 'Company deleted successfully' };
  }
}
