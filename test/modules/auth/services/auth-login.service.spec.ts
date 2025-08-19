import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { AuthLoginService } from '../../../../src/modules/auth/services/auth-login.service';
import { UserRepository } from '../../../../src/modules/user/repository/user.repository';
import { CompanyRepository } from '../../../../src/modules/company/repository/company.repository';
import {
  userLoginMock,
  companyLoginMock,
  invalidUserLoginMock,
  userWithUnconfirmedEmailMock,
} from '../../../mocks/auth/user-login.mock';
import { userMock } from '../../../mocks/user/user.mock';
import {
  companyMock,
  companyWithUnconfirmedEmailMock,
} from '../../../mocks/auth/company.mock';

jest.mock('bcrypt');
const bcryptMock = bcrypt as jest.Mocked<typeof bcrypt>;

class UserRepositoryMock {
  findOneByEmail = jest.fn();
}

class CompanyRepositoryMock {
  findOneByEmail = jest.fn();
}

class JwtServiceMock {
  sign = jest.fn();
}

describe('AuthLoginService', () => {
  let service: AuthLoginService;
  let userRepository: UserRepositoryMock;
  let companyRepository: CompanyRepositoryMock;
  let jwtService: JwtServiceMock;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthLoginService,
        {
          provide: UserRepository,
          useClass: UserRepositoryMock,
        },
        {
          provide: CompanyRepository,
          useClass: CompanyRepositoryMock,
        },
        {
          provide: JwtService,
          useClass: JwtServiceMock,
        },
      ],
    }).compile();

    service = module.get<AuthLoginService>(AuthLoginService);
    userRepository = module.get(UserRepository);
    companyRepository = module.get(CompanyRepository);
    jwtService = module.get(JwtService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('execute', () => {
    describe('User Login', () => {
      it('should successfully login a user with valid credentials', async () => {
        const loginData = userLoginMock();
        const user = {
          ...userMock(),
          password: 'hashedPassword',
          mailConfirm: true,
        };

        userRepository.findOneByEmail.mockResolvedValue(user);
        bcryptMock.compare.mockResolvedValue(true as never);
        jwtService.sign.mockReturnValue('fake-jwt-token');

        const result = await service.execute(loginData);

        expect(result.status).toBe(200);
        expect(result.data.token).toBe('fake-jwt-token');
        expect(result.data.info).toBeDefined();
        expect(result.data.info.password).toBeUndefined();
        expect(result.data.info.recoverPasswordToken).toBeUndefined();
        expect(userRepository.findOneByEmail).toHaveBeenCalledWith(
          loginData.email,
        );
        expect(bcryptMock.compare).toHaveBeenCalledWith(
          loginData.password,
          'hashedPassword',
        );
        expect(jwtService.sign).toHaveBeenCalledWith({
          email: loginData.email,
        });
      });

      it('should return error when user email is not confirmed', async () => {
        const loginData = userWithUnconfirmedEmailMock();
        const user = {
          ...userMock(),
          password: 'hashedPassword',
          mailConfirm: false,
        };

        userRepository.findOneByEmail.mockResolvedValue(user);

        const result = await service.execute(loginData);

        expect(result.status).toBe(400);
        expect(result.data.message).toBe('Email not validated');
        expect(userRepository.findOneByEmail).toHaveBeenCalledWith(
          loginData.email,
        );
        expect(bcryptMock.compare).not.toHaveBeenCalled();
        expect(jwtService.sign).not.toHaveBeenCalled();
      });

      it('should return error when user does not exist', async () => {
        const loginData = invalidUserLoginMock();

        userRepository.findOneByEmail.mockResolvedValue(null);

        const result = await service.execute(loginData);

        expect(result.status).toBe(400);
        expect(result.data.message).toBe('Email not validated');
        expect(userRepository.findOneByEmail).toHaveBeenCalledWith(
          loginData.email,
        );
        expect(bcryptMock.compare).not.toHaveBeenCalled();
        expect(jwtService.sign).not.toHaveBeenCalled();
      });

      it('should return error when password is invalid', async () => {
        const loginData = userLoginMock();
        const user = {
          ...userMock(),
          password: 'hashedPassword',
          mailConfirm: true,
        };

        userRepository.findOneByEmail.mockResolvedValue(user);
        bcryptMock.compare.mockResolvedValue(false as never);

        const result = await service.execute(loginData);

        expect(result.status).toBe(400);
        expect(result.data.message).toBe('E-mail ou Senha não conferem');
        expect(userRepository.findOneByEmail).toHaveBeenCalledWith(
          loginData.email,
        );
        expect(bcryptMock.compare).toHaveBeenCalledWith(
          loginData.password,
          user.password,
        );
        expect(jwtService.sign).not.toHaveBeenCalled();
      });
    });

    describe('Company Login', () => {
      it('should successfully login a company with valid credentials', async () => {
        const loginData = companyLoginMock();
        const company = {
          ...companyMock(),
          password: 'hashedPassword',
          mailConfirm: true,
        };

        companyRepository.findOneByEmail.mockResolvedValue(company);
        bcryptMock.compare.mockResolvedValue(true as never);
        jwtService.sign.mockReturnValue('fake-jwt-token');

        const result = await service.execute(loginData);

        expect(result.status).toBe(200);
        expect(result.data.token).toBe('fake-jwt-token');
        expect(result.data.info).toBeDefined();
        expect(result.data.info.password).toBeUndefined();
        expect(result.data.info.recoverPasswordToken).toBeUndefined();
        expect(companyRepository.findOneByEmail).toHaveBeenCalledWith(
          loginData.email,
        );
        expect(bcryptMock.compare).toHaveBeenCalledWith(
          loginData.password,
          'hashedPassword',
        );
        expect(jwtService.sign).toHaveBeenCalledWith({
          email: loginData.email,
        });
      });

      it('should return error when company email is not confirmed', async () => {
        const loginData = {
          ...companyLoginMock(),
          email: 'unconfirmed@test.com',
        };
        const company = companyWithUnconfirmedEmailMock();

        companyRepository.findOneByEmail.mockResolvedValue(company);

        const result = await service.execute(loginData);

        expect(result.status).toBe(400);
        expect(result.data.message).toBe('Email not validated');
        expect(companyRepository.findOneByEmail).toHaveBeenCalledWith(
          loginData.email,
        );
        expect(bcryptMock.compare).not.toHaveBeenCalled();
        expect(jwtService.sign).not.toHaveBeenCalled();
      });

      it('should return error when company does not exist', async () => {
        const loginData = companyLoginMock();

        companyRepository.findOneByEmail.mockResolvedValue(null);

        const result = await service.execute(loginData);

        expect(result.status).toBe(400);
        expect(result.data.message).toBe('Email not validated');
        expect(companyRepository.findOneByEmail).toHaveBeenCalledWith(
          loginData.email,
        );
        expect(bcryptMock.compare).not.toHaveBeenCalled();
        expect(jwtService.sign).not.toHaveBeenCalled();
      });

      it('should return error when company password is invalid', async () => {
        const loginData = companyLoginMock();
        const company = {
          ...companyMock(),
          password: 'hashedPassword',
          mailConfirm: true,
        };

        companyRepository.findOneByEmail.mockResolvedValue(company);
        bcryptMock.compare.mockResolvedValue(false as never);

        const result = await service.execute(loginData);

        expect(result.status).toBe(400);
        expect(result.data.message).toBe('E-mail ou Senha não conferem');
        expect(companyRepository.findOneByEmail).toHaveBeenCalledWith(
          loginData.email,
        );
        expect(bcryptMock.compare).toHaveBeenCalledWith(
          loginData.password,
          company.password,
        );
        expect(jwtService.sign).not.toHaveBeenCalled();
      });
    });

    describe('Data Sanitization', () => {
      it('should remove sensitive fields from user response', async () => {
        const loginData = userLoginMock();
        const user = {
          ...userMock(),
          password: 'hashedPassword',
          recoverPasswordToken: 'some-token',
          mailconfirm: true,
          ip: '192.168.1.1',
          mailConfirm: true,
        };

        userRepository.findOneByEmail.mockResolvedValue(user);
        bcryptMock.compare.mockResolvedValue(true as never);
        jwtService.sign.mockReturnValue('fake-jwt-token');

        const result = await service.execute(loginData);

        expect(result.status).toBe(200);
        expect(result.data.info.password).toBeUndefined();
        expect(result.data.info.recoverPasswordToken).toBeUndefined();
        expect(result.data.info.mailconfirm).toBeUndefined();
        expect(result.data.info.ip).toBeUndefined();
      });

      it('should remove sensitive fields from company response', async () => {
        const loginData = companyLoginMock();
        const company = {
          ...companyMock(),
          password: 'hashedPassword',
          recoverPasswordToken: 'some-token',
          mailconfirm: true,
          ip: '192.168.1.1',
          mailConfirm: true,
        };

        companyRepository.findOneByEmail.mockResolvedValue(company);
        bcryptMock.compare.mockResolvedValue(true as never);
        jwtService.sign.mockReturnValue('fake-jwt-token');

        const result = await service.execute(loginData);

        expect(result.status).toBe(200);
        expect(result.data.info.password).toBeUndefined();
        expect(result.data.info.recoverPasswordToken).toBeUndefined();
        expect(result.data.info.mailconfirm).toBeUndefined();
        expect(result.data.info.ip).toBeUndefined();
      });
    });
  });
});
