import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { JwtService } from '@nestjs/jwt';
import { AuthController } from '../../../src/modules/auth/auth.controller';
import { AuthLoginService } from '../../../src/modules/auth/services/auth-login.service';
import { UserRepository } from '../../../src/modules/user/repository/user.repository';
import { CompanyRepository } from '../../../src/modules/company/repository/company.repository';
import {
  userLoginMock,
  companyLoginMock,
  invalidUserLoginMock,
} from '../../mocks/auth/user-login.mock';
import { userMock } from '../../mocks/user/user.mock';
import { companyMock } from '../../mocks/auth/company.mock';

describe('AuthController (e2e)', () => {
  let app: INestApplication;
  let authLoginService: any;

  const mockUserRepository = {
    findOneByEmail: jest.fn(),
  };

  const mockCompanyRepository = {
    findOneByEmail: jest.fn(),
  };

  beforeEach(async () => {
    const mockAuthLoginService = {
      execute: jest.fn(),
    };

    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthLoginService,
          useValue: mockAuthLoginService,
        },
        {
          provide: JwtService,
          useValue: {
            sign: jest.fn().mockReturnValue('fake-jwt-token'),
            verify: jest.fn(),
          },
        },
        {
          provide: UserRepository,
          useValue: mockUserRepository,
        },
        {
          provide: CompanyRepository,
          useValue: mockCompanyRepository,
        },
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe());
    authLoginService = moduleFixture.get<AuthLoginService>(AuthLoginService);

    await app.init();

    jest.clearAllMocks();
  });

  afterEach(async () => {
    jest.restoreAllMocks();
    if (app) {
      await app.close();
    }
  });

  describe('/auth/login (POST)', () => {
    it('should successfully login a user', async () => {
      const loginData = userLoginMock();
      const mockResponse = {
        status: 200,
        data: {
          token: 'fake-jwt-token',
          info: userMock(),
        },
      };

      authLoginService.execute.mockResolvedValue(mockResponse);

      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send(loginData)
        .expect(200);

      expect(response.body).toHaveProperty('token');
      expect(response.body).toHaveProperty('info');
      expect(authLoginService.execute).toHaveBeenCalledWith(loginData);
    });

    it('should successfully login a company', async () => {
      const loginData = companyLoginMock();
      const mockResponse = {
        status: 200,
        data: {
          token: 'fake-jwt-token',
          info: companyMock(),
        },
      };

      authLoginService.execute.mockResolvedValue(mockResponse);

      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send(loginData)
        .expect(200);

      expect(response.body).toHaveProperty('token');
      expect(response.body).toHaveProperty('info');
      expect(authLoginService.execute).toHaveBeenCalledWith(loginData);
    });

    it('should return 400 for invalid credentials', async () => {
      const loginData = invalidUserLoginMock();
      const mockResponse = {
        status: 400,
        data: { message: 'Email not validated' },
      };

      authLoginService.execute.mockResolvedValue(mockResponse);

      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send(loginData)
        .expect(400);

      expect(response.body).toHaveProperty('message', 'Email not validated');
      expect(authLoginService.execute).toHaveBeenCalledWith(loginData);
    });

    it('should return 400 for unconfirmed email', async () => {
      const loginData = userLoginMock();
      const mockResponse = {
        status: 400,
        data: {
          message: 'Please confirm your email before logging in',
          code: 'EMAIL_NOT_CONFIRMED',
        },
      };

      authLoginService.execute.mockResolvedValue(mockResponse);

      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send(loginData)
        .expect(400);

      expect(response.body).toHaveProperty(
        'message',
        'Please confirm your email before logging in',
      );
      expect(response.body).toHaveProperty('code', 'EMAIL_NOT_CONFIRMED');
      expect(authLoginService.execute).toHaveBeenCalledWith(loginData);
    });

    it('should return 400 for invalid login data format', async () => {
      const invalidLoginData = {
        email: 'invalid-email',
        password: '123',
        type: 'INVALID_TYPE',
      };

      await request(app.getHttpServer())
        .post('/auth/login')
        .send(invalidLoginData)
        .expect(400);
    });

    it('should return 400 for missing required fields', async () => {
      const incompleteLoginData = {
        email: 'test@test.com',
      };

      await request(app.getHttpServer())
        .post('/auth/login')
        .send(incompleteLoginData)
        .expect(400);
    });
  });
});
