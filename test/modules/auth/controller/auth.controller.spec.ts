import { Test, TestingModule } from '@nestjs/testing';
import { Response } from 'express';
import { AuthController } from '../../../../src/modules/auth/auth.controller';
import { AuthLoginService } from '../../../../src/modules/auth/services/auth-login.service';
import {
  userLoginMock,
  companyLoginMock,
  invalidUserLoginMock,
} from '../../../mocks/auth/user-login.mock';
import { userMock } from '../../../mocks/user/user.mock';
import { companyEntityMock } from '../../../mocks/auth/company.mock';

class AuthLoginServiceMock {
  execute = jest.fn();
}

const mockResponse = () => {
  const res: Partial<Response> = {};
  res.status = jest.fn().mockReturnValue(res);
  res.send = jest.fn().mockReturnValue(res);
  return res as Response;
};

describe('AuthController', () => {
  let controller: AuthController;
  let authLoginService: jest.Mocked<AuthLoginService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthLoginService,
          useClass: AuthLoginServiceMock,
        },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    authLoginService =
      module.get<jest.Mocked<AuthLoginService>>(AuthLoginService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('login', () => {
    it('should successfully login user and return response with status 200', async () => {
      const loginData = userLoginMock();
      const mockServiceResponse = {
        status: 200,
        data: {
          token: 'fake-jwt-token',
          info: userMock(),
        },
      };
      const res = mockResponse();

      authLoginService.execute.mockResolvedValue(mockServiceResponse);

      await controller.login(loginData, res);

      expect(authLoginService.execute).toHaveBeenCalledWith(loginData);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.send).toHaveBeenCalledWith(mockServiceResponse.data);
    });

    it('should successfully login company and return response with status 200', async () => {
      const loginData = companyLoginMock();
      const mockServiceResponse = {
        status: 200,
        data: {
          token: 'fake-jwt-token',
          info: companyEntityMock(),
        },
      };
      const res = mockResponse();

      authLoginService.execute.mockResolvedValue(mockServiceResponse);

      await controller.login(loginData, res);

      expect(authLoginService.execute).toHaveBeenCalledWith(loginData);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.send).toHaveBeenCalledWith(mockServiceResponse.data);
    });

    it('should return error response with status 400 for invalid credentials', async () => {
      const loginData = invalidUserLoginMock();
      const mockServiceResponse = {
        status: 400,
        data: { message: 'E-mail ou Senha não conferem' },
      };
      const res = mockResponse();

      authLoginService.execute.mockResolvedValue(mockServiceResponse);

      await controller.login(loginData, res);

      expect(authLoginService.execute).toHaveBeenCalledWith(loginData);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.send).toHaveBeenCalledWith(mockServiceResponse.data);
    });

    it('should return error response with status 400 for unconfirmed email', async () => {
      const loginData = userLoginMock();
      const mockServiceResponse = {
        status: 400,
        data: { message: 'Email not validated' },
      };
      const res = mockResponse();

      authLoginService.execute.mockResolvedValue(mockServiceResponse);

      await controller.login(loginData, res);

      expect(authLoginService.execute).toHaveBeenCalledWith(loginData);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.send).toHaveBeenCalledWith(mockServiceResponse.data);
    });

    it('should handle service exceptions properly', async () => {
      const loginData = userLoginMock();
      const res = mockResponse();
      const error = new Error('Service error');

      authLoginService.execute.mockRejectedValue(error);

      await expect(controller.login(loginData, res)).rejects.toThrow(
        'Service error',
      );

      expect(authLoginService.execute).toHaveBeenCalledWith(loginData);
      expect(res.status).not.toHaveBeenCalled();
      expect(res.send).not.toHaveBeenCalled();
    });
  });

  describe('userLogged', () => {
    it('should return logged user information', async () => {
      const user = userMock() as any;

      const result = await controller.userLogged(user);

      expect(result).toEqual(user);
    });

    it('should return logged company information', async () => {
      const company = companyEntityMock() as any;

      const result = await controller.userLogged(company);

      expect(result).toEqual(company);
    });

    it('should handle undefined user', async () => {
      const result = await controller.userLogged(undefined as any);

      expect(result).toBeUndefined();
    });

    it('should return user with all fields intact', async () => {
      const userWithExtraFields = {
        ...userMock(),
        additionalField: 'extra-data',
        settings: { theme: 'dark' },
      } as any;

      const result = await controller.userLogged(userWithExtraFields);

      expect(result).toEqual(userWithExtraFields);
      expect((result as any).additionalField).toBe('extra-data');
      expect((result as any).settings).toEqual({ theme: 'dark' });
    });
  });
});
