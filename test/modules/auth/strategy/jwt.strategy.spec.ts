import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtStrategy } from '../../../../src/modules/auth/jwt/jwt.strategy';
import { UserRepository } from '../../../../src/modules/user/repository/user.repository';
import { CompanyRepository } from '../../../../src/modules/company/repository/company.repository';
import {
  jwtPayloadMock,
  companyJwtPayloadMock,
  invalidJwtPayloadMock,
} from '../../../mocks/auth/jwt-payload.mock';
import {
  mapUserToPrincipal,
  mapCompanyToPrincipal,
} from '../../../../src/modules/auth/utils/principal.mapper';
import {
  TEST_PASSWORDS,
  TEST_EMAILS,
  TEST_COMPANY_DATA,
  TEST_USER_DATA,
} from '../../../config/test-constants';

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
    it('should successfully validate and return user principal matching mapper output', async () => {
      const payload = jwtPayloadMock();
      const user = {
        id: '729c7919-583c-40a5-b0ca-137e282345d4',
        name: 'Non-Admin for tests',
        email: TEST_EMAILS.USER,
        password: TEST_PASSWORDS.HASHED,
        type: 'USER',
        phone: TEST_USER_DATA.PHONE,
        policies: true,
        ip: null,
        mainPhone: null,
        city: null,
        state: null,
        profile: null,
        profileKey: null,
        personalData: null,
        curriculums: [],
        applications: [],
        candidacies: [],
        savedJobs: [],
        created_at: new Date(),
        updated_at: new Date(),
        mailConfirm: false,
        recoverPasswordToken: null,
      };
      const expectedPrincipal = mapUserToPrincipal(user);

      userRepository.findOneByEmail.mockResolvedValue(user);

      const result = await strategy.validate(payload);

      expect(result).toEqual(expectedPrincipal);

      expect(result).not.toHaveProperty('password');

      const resultKeys = Object.keys(result);
      const expectedKeys = Object.keys(expectedPrincipal);
      expect(resultKeys.sort()).toEqual(expectedKeys.sort());

      expect(userRepository.findOneByEmail).toHaveBeenCalledWith(payload.email);
      expect(companyRepository.findOneByEmail).not.toHaveBeenCalled();
    });

    it('should successfully validate and return company principal matching mapper output', async () => {
      const payload = companyJwtPayloadMock();
      const company = {
        id: '729c7919-583c-40a5-b0ca-137e282345d4',
        companyName: 'Test Company Ltd',
        email: TEST_EMAILS.COMPANY,
        password: TEST_PASSWORDS.HASHED,
        cnpj: TEST_COMPANY_DATA.CNPJ,
        jobs: [],
        created_at: new Date(),
        updated_at: new Date(),
        mailConfirm: true,
        recoverPasswordToken: null,
        companyType: null,
        companySize: null,
        uf: null,
        companySite: null,
        otherSite: null,
        description: null,
        profile: null,
        profileKey: null,
      };
      const expectedPrincipal = mapCompanyToPrincipal(company);

      userRepository.findOneByEmail.mockResolvedValue(null);
      companyRepository.findOneByEmail.mockResolvedValue(company);

      const result = await strategy.validate(payload);

      expect(result).toEqual(expectedPrincipal);

      expect(result).not.toHaveProperty('password');

      const resultKeys = Object.keys(result);
      const expectedKeys = Object.keys(expectedPrincipal);
      expect(resultKeys.sort()).toEqual(expectedKeys.sort());

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

    it('should return user principal with exact fields from mapper, no additional fields', async () => {
      const payload = jwtPayloadMock();
      const userWithExtraFields = {
        id: '729c7919-583c-40a5-b0ca-137e282345d4',
        name: 'Non-Admin for tests',
        email: TEST_EMAILS.USER,
        password: TEST_PASSWORDS.SENSITIVE,
        type: 'USER',
        phone: TEST_USER_DATA.PHONE,
        policies: true,
        ip: null,
        mainPhone: null,
        city: null,
        state: null,
        profile: null,
        profileKey: null,
        personalData: null,
        curriculums: [],
        applications: [],
        candidacies: [],
        savedJobs: [],
        created_at: new Date(),
        updated_at: new Date(),
        mailConfirm: false,
        recoverPasswordToken: null,

        secretKey: 'should-not-be-included',
        internalData: 'should-not-be-included',
        additionalField: 'should-not-be-included',
      } as any;

      userRepository.findOneByEmail.mockResolvedValue(userWithExtraFields);

      const result = await strategy.validate(payload);
      const expectedPrincipal = mapUserToPrincipal(userWithExtraFields);

      expect(result).toEqual(expectedPrincipal);

      expect(result).not.toHaveProperty('password');
      expect(result).not.toHaveProperty('secretKey');
      expect(result).not.toHaveProperty('internalData');
      expect(result).not.toHaveProperty('additionalField');

      expect(result).toHaveProperty('id');
      expect(result).toHaveProperty('name');
      expect(result).toHaveProperty('email');
      expect(result).toHaveProperty('type');
      expect(result).toHaveProperty('userType');
      expect(result.userType).toBe('user');

      expect(userRepository.findOneByEmail).toHaveBeenCalledWith(payload.email);
    });

    it('should return company principal with exact fields from mapper, no additional fields', async () => {
      const payload = companyJwtPayloadMock();
      const companyWithExtraFields = {
        id: '729c7919-583c-40a5-b0ca-137e282345d4',
        companyName: 'Test Company Ltd',
        email: TEST_EMAILS.COMPANY,
        password: TEST_PASSWORDS.SENSITIVE,
        cnpj: TEST_COMPANY_DATA.CNPJ,
        jobs: [],
        created_at: new Date(),
        updated_at: new Date(),
        mailConfirm: true,
        recoverPasswordToken: null,
        companyType: null,
        companySize: null,
        uf: null,
        companySite: null,
        otherSite: null,
        description: null,
        profile: null,
        profileKey: null,

        secretInfo: 'should-not-be-included',
        internalData: 'should-not-be-included',
        additionalField: 'should-not-be-included',
      } as any;

      userRepository.findOneByEmail.mockResolvedValue(null);
      companyRepository.findOneByEmail.mockResolvedValue(
        companyWithExtraFields,
      );

      const result = await strategy.validate(payload);
      const expectedPrincipal = mapCompanyToPrincipal(companyWithExtraFields);

      expect(result).toEqual(expectedPrincipal);

      expect(result).not.toHaveProperty('password');
      expect(result).not.toHaveProperty('secretInfo');
      expect(result).not.toHaveProperty('internalData');
      expect(result).not.toHaveProperty('additionalField');

      expect(result).toHaveProperty('id');
      expect(result).toHaveProperty('companyName');
      expect(result).toHaveProperty('email');
      expect(result).toHaveProperty('cnpj');
      expect(result).toHaveProperty('userType');
      expect(result.userType).toBe('company');

      expect(userRepository.findOneByEmail).toHaveBeenCalledWith(payload.email);
      expect(companyRepository.findOneByEmail).toHaveBeenCalledWith(
        payload.email,
      );
    });

    it('should throw UnauthorizedException for invalid payload without email', async () => {
      const invalidPayload = { email: null } as any;

      const promise = strategy.validate(invalidPayload);

      await expect(promise).rejects.toBeInstanceOf(UnauthorizedException);
      await expect(promise).rejects.toHaveProperty(
        'message',
        'Invalid payload or email',
      );
    });

    it('should throw UnauthorizedException for undefined payload', async () => {
      const invalidPayload = undefined as any;

      const promise = strategy.validate(invalidPayload);

      await expect(promise).rejects.toBeInstanceOf(UnauthorizedException);
      await expect(promise).rejects.toHaveProperty(
        'message',
        'Invalid payload or email',
      );
    });
  });
});
