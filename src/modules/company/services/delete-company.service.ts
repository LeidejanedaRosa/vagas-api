import { Injectable } from '@nestjs/common';
import { CompanyRepository } from '../repository/company.repository';

@Injectable()
export class DeleteCompanyService {
  constructor(private companyRepository: CompanyRepository) {}

  async execute(id: string) {
    // O repositório agora verifica a existência e lança NotFoundException se não encontrar
    const result = await this.companyRepository.deleteCompanyById(id);

    return {
      status: 200,
      data: result,
    };
  }
}
