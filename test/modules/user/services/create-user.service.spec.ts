import { Test, TestingModule } from '@nestjs/testing';
import { Request } from 'express';
import { MailService } from '../../../../src/modules/mails/mail.service';
import { UserRepository } from '../../../../src/modules/user/repository/user.repository';
import { CompanyRepository } from '../../../../src/modules/company/repository/company.repository';
import { CreateUserService } from '../../../../src/modules/user/services';
import { createUserMock } from '../../../mocks/user/create-user.mock';
import { userMock } from '../../../mocks/user/user.mock';

class UserRepositoryMock {
  createUser = jest.fn();
  findOneByEmail = jest.fn();
  findOneByCpf = jest.fn();
}

class CompanyRepositoryMock {
  findOneByEmail = jest.fn();
}

class MailServiceMock {
  sendUserCreationConfirmation = jest.fn();
}

const mockRequest = (): Partial<Request> => ({
  ip: '127.0.0.1',
});

describe('CreateUserService', () => {
  let service: CreateUserService;
  let userRepository: UserRepositoryMock;
  let companyRepository: CompanyRepositoryMock;
  let mailService: MailServiceMock;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CreateUserService],
      providers: [
        {
          provide: UserRepository,
          useClass: UserRepositoryMock,
        },
        {
          provide: CompanyRepository,
          useClass: CompanyRepositoryMock,
        },
        {
          provide: MailService,
          useClass: MailServiceMock,
        },
      ],
    }).compile();

    service = module.get(CreateUserService);
    userRepository = module.get(UserRepository);
    companyRepository = module.get(CompanyRepository);
    mailService = module.get(MailService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('execute', () => {
    it('should be able to return a error when email exists', async () => {
      companyRepository.findOneByEmail = jest.fn().mockResolvedValue(null);
      userRepository.findOneByEmail = jest
        .fn()
        .mockResolvedValue(createUserMock());
      const sendUserConfirmationSpy = jest.spyOn(
        mailService,
        'sendUserCreationConfirmation',
      );
      const findOneByEmailSpy = jest.spyOn(userRepository, 'findOneByEmail');
      const findOneByCpfSpy = jest.spyOn(userRepository, 'findOneByCpf');
      const createUserSpy = jest.spyOn(userRepository, 'createUser');
      const createUserDto = createUserMock();
      const req = mockRequest() as Request;
      const { data, status } = await service.execute(createUserDto, req);
      expect(status).toEqual(404);
      expect(data).toEqual({
        message: 'E-mail já cadastrado',
      });
      expect(findOneByEmailSpy).toBeCalled();
      expect(findOneByEmailSpy).toBeCalledTimes(1);
      expect(findOneByCpfSpy).not.toBeCalled();
      expect(createUserSpy).not.toBeCalled();
      expect(sendUserConfirmationSpy).not.toBeCalled();
    });

    it('should be able to return a error when company email exists', async () => {
      companyRepository.findOneByEmail = jest
        .fn()
        .mockResolvedValue({ id: 1, email: 'test@company.com' });
      userRepository.findOneByEmail = jest.fn().mockResolvedValue(null);
      const findOneByEmailSpy = jest.spyOn(userRepository, 'findOneByEmail');
      const createUserSpy = jest.spyOn(userRepository, 'createUser');
      const createUserDto = createUserMock();
      const req = mockRequest() as Request;
      const { data, status } = await service.execute(createUserDto, req);
      expect(status).toEqual(404);
      expect(data).toEqual({
        message: `E-mail já cadastrado`,
      });
      expect(findOneByEmailSpy).toBeCalled();
      expect(findOneByEmailSpy).toBeCalledTimes(1);
      expect(createUserSpy).not.toBeCalled();
    });

    it('should be able to create an user', async () => {
      companyRepository.findOneByEmail = jest.fn().mockResolvedValue(null);
      userRepository.findOneByEmail = jest.fn().mockResolvedValue(null);

      const userWithSensitiveData = {
        ...userMock(),
        password: 'hashedPassword',
        recoverPasswordToken: 'token123',
        ip: '127.0.0.1',
      };

      userRepository.createUser = jest
        .fn()
        .mockResolvedValue(userWithSensitiveData);
      mailService.sendUserCreationConfirmation = jest
        .fn()
        .mockResolvedValue('');
      const sendUserConfirmationSpy = jest.spyOn(
        mailService,
        'sendUserCreationConfirmation',
      );
      const findOneByEmailSpy = jest.spyOn(userRepository, 'findOneByEmail');
      const createUserSpy = jest.spyOn(userRepository, 'createUser');
      const createUserDto = createUserMock();
      const req = mockRequest() as Request;
      const { data, status } = await service.execute(createUserDto, req);
      expect(status).toEqual(201);
      expect(data).toEqual(userMock());
      expect(findOneByEmailSpy).toBeCalled();
      expect(findOneByEmailSpy).toBeCalledTimes(1);
      expect(createUserSpy).toBeCalled();
      expect(createUserSpy).toBeCalledTimes(1);
      expect(sendUserConfirmationSpy).toBeCalled();
      expect(sendUserConfirmationSpy).toBeCalledTimes(1);
    });
  });
});
