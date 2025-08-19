import { CreateUserDto } from '../../../src/modules/user/dtos/create-user.dto';
import { UserRole } from '../../../src/shared/utils/userRole/userRole';

export const createUserMock = (): CreateUserDto => {
  return {
    name: 'Non-Admin for tests',
    email: 'user@teste.com',
    password: 'teste@12A',
    confirmPassword: 'teste@12A',
    type: UserRole.USER,
  };
};
