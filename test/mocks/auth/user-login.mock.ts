import { LoginTypeEnum } from '../../../src/modules/auth/enums/login-type.enum';
import { UserLoginDto } from '../../../src/modules/auth/dtos/user-login.dto';

export const userLoginMock = (): UserLoginDto => {
  return {
    email: 'user@test.com',
    password: 'Test@1234',
    type: LoginTypeEnum.USER,
  };
};

export const companyLoginMock = (): UserLoginDto => {
  return {
    email: 'company@test.com',
    password: 'Test@1234',
    type: LoginTypeEnum.COMPANY,
  };
};

export const invalidUserLoginMock = (): UserLoginDto => {
  return {
    email: 'invalid@test.com',
    password: 'WrongPassword@123',
    type: LoginTypeEnum.USER,
  };
};

export const userWithUnconfirmedEmailMock = (): UserLoginDto => {
  return {
    email: 'unconfirmed@test.com',
    password: 'Test@1234',
    type: LoginTypeEnum.USER,
  };
};
