import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtStrategy } from '../../../../src/modules/auth/jwt/jwt.strategy';
import { UserRepository } from '../../../../src/modules/user/repository/user.repository';
import { CompanyRepository } from '../../../../src/modules/company/repository/company.repository';
import { userMock } from '../../../mocks/user/user.mock';
import { companyEntityMock } from '../../../mocks/auth/company.mock';
import {
  jwtPayloadMock,
  companyJwtPayloadMock,
  invalidJwtPayloadMock,
} from '../../../mocks/auth/jwt-payload.mock';

jest.mock('../../../../src/shared/utils/handle-error.util', () => ({
  handleError: jest.fn((error) => {
    throw error;
  }),
}));

class UserRepositoryMock {
  findOneByEmail = jest.fn();
}

class CompanyRepositoryMock {
  findOneByEmail = jest.fn();
}

describe('JwtStrategy', () => {
  let strategy: JwtStrategy;
  let userRepository: UserRepositoryMock;
  let companyRepository: CompanyRepositoryMock;

  beforeEach(async () => {
    process.env.JWT_SECRET = 'test-secret-key';

    const configServiceMock = {
      getOrThrow: jest.fn().mockReturnValue('test-secret-key'),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        JwtStrategy,
        {
          provide: UserRepository,
          useClass: UserRepositoryMock,
        },
        {
          provide: CompanyRepository,
          useClass: CompanyRepositoryMock,
        },
        {
          provide: ConfigService,
          useValue: configServiceMock,
        },
      ],
    }).compile();

    strategy = module.get<JwtStrategy>(JwtStrategy);
    userRepository = module.get(UserRepository);
    companyRepository = module.get(CompanyRepository);

    jest.clearAllMocks();
  });

  afterEach(() => {
    delete process.env.JWT_SECRET;
  });

  it('should be defined', () => {
    expect(strategy).toBeDefined();
  });

  describe('validate', () => {
    it('should successfully validate and return user when user exists', async () => {
      const payload = jwtPayloadMock();
      const user = { ...userMock(), password: 'hashedPassword' };
      const expectedUser = { ...userMock(), userType: 'user' };

      userRepository.findOneByEmail.mockResolvedValue(user);

      const result = await strategy.validate(payload);

      expect(result).toEqual(expectedUser);
      expect(result).not.toHaveProperty('password');
      expect(userRepository.findOneByEmail).toHaveBeenCalledWith(payload.email);
      expect(companyRepository.findOneByEmail).not.toHaveBeenCalled();
    });

    it('should successfully validate and return company when user not found but company exists', async () => {
      const payload = companyJwtPayloadMock();
      const company = { ...companyEntityMock(), password: 'hashedPassword' };
      const expectedCompany = { ...companyEntityMock(), userType: 'company' };

      userRepository.findOneByEmail.mockResolvedValue(null);
      companyRepository.findOneByEmail.mockResolvedValue(company);

      const result = await strategy.validate(payload);

      expect(result).toEqual(expectedCompany);
      expect(result).not.toHaveProperty('password');
      expect(userRepository.findOneByEmail).toHaveBeenCalledWith(payload.email);
      expect(companyRepository.findOneByEmail).toHaveBeenCalledWith(
        payload.email,
      );
    });

    it('should throw UnauthorizedException when neither user nor company is found', async () => {
      const payload = invalidJwtPayloadMock();

      userRepository.findOneByEmail.mockResolvedValue(null);
      companyRepository.findOneByEmail.mockResolvedValue(null);

      const promise = strategy.validate(payload);

      await expect(promise).rejects.toBeInstanceOf(UnauthorizedException);
      await expect(promise).rejects.toHaveProperty(
        'message',
        'User not found or not authorized!',
      );

      expect(userRepository.findOneByEmail).toHaveBeenCalledWith(payload.email);
      expect(companyRepository.findOneByEmail).toHaveBeenCalledWith(
        payload.email,
      );
    });

    it('should remove password field from user response', async () => {
      const payload = jwtPayloadMock();
      const userWithSensitiveData = {
        ...userMock(),
        password: 'sensitivePassword',
        secretKey: 'should-remain',
      } as any;

      userRepository.findOneByEmail.mockResolvedValue(userWithSensitiveData);

      const result = (await strategy.validate(payload)) as any;

      expect(result).not.toHaveProperty('password');
      expect(result.secretKey).toBe('should-remain');
      expect(userRepository.findOneByEmail).toHaveBeenCalledWith(payload.email);
    });

    it('should remove password field from company response', async () => {
      const payload = companyJwtPayloadMock();
      const companyWithSensitiveData = {
        ...companyEntityMock(),
        password: 'sensitivePassword',
        secretInfo: 'should-remain',
      } as any;

      userRepository.findOneByEmail.mockResolvedValue(null);
      companyRepository.findOneByEmail.mockResolvedValue(
        companyWithSensitiveData,
      );

      const result = (await strategy.validate(payload)) as any;

      expect(result).not.toHaveProperty('password');
      expect(result.secretInfo).toBe('should-remain');
      expect(userRepository.findOneByEmail).toHaveBeenCalledWith(payload.email);
      expect(companyRepository.findOneByEmail).toHaveBeenCalledWith(
        payload.email,
      );
    });
  });
});
