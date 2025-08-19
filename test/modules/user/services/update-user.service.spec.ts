import { Test, TestingModule } from '@nestjs/testing';
import { UserRepository } from '../../../../src/modules/user/repository/user.repository';
import { UpdateUserService } from '../../../../src/modules/user/services/update-user.service';
import { FileUploadService } from '../../../../src/modules/upload/upload.service';
import { userUpdateMock } from '../../../mocks/user/user-update.mock';
import { TEST_USER_DATA } from '../../../config/test-constants';
import { userMock, userEntityMock } from '../../../mocks/user/user.mock';

class UserRepositoryMock {
  findOneById = jest.fn();
  updateUser = jest.fn();
}

class FileUploadServiceMock {
  upload = jest.fn();
  uploadFile = this.upload;
  deleteFile = jest.fn();
}

describe('UpdateUserService', () => {
  let service: UpdateUserService;
  let userRepository: UserRepositoryMock;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UpdateUserService],
      providers: [
        {
          provide: UserRepository,
          useClass: UserRepositoryMock,
        },
        {
          provide: FileUploadService,
          useClass: FileUploadServiceMock,
        },
      ],
    }).compile();

    service = module.get(UpdateUserService);
    userRepository = module.get(UserRepository);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('execute', () => {
    it('should return error when file is provided but profileKey is missing', async () => {
      const updateUserSpy = jest.spyOn(userRepository, 'updateUser');

      const updateDto = {
        name: 'Test',
        mainPhone: TEST_USER_DATA.MAIN_PHONE,
        phone: TEST_USER_DATA.SECONDARY_PHONE,
        city: 'São Paulo',
        state: 'SP',
      };

      const mockFile = {
        originalname: 'test.jpg',
        buffer: Buffer.from('test'),
      };

      const response = await service.execute(
        userEntityMock() as any,
        updateDto as any,
        mockFile,
      );

      expect(response).toEqual({
        status: 400,
        data: {
          message: 'profileKey is required when file is send',
        },
      });
      expect(updateUserSpy).not.toHaveBeenCalled();
    });

    it('should be able to update an user with file when profileKey is provided', async () => {
      const fileUploadService = service['fileUploadService'];
      fileUploadService.deleteFile = jest.fn().mockResolvedValue(undefined);
      fileUploadService.upload = jest.fn().mockResolvedValue({
        Location: 'https://s3.bucket.com/file.jpg',
        key: 'uploads/file.jpg',
      });

      userRepository.updateUser = jest.fn().mockResolvedValue(undefined);
      const updateUserSpy = jest.spyOn(userRepository, 'updateUser');
      const deleteFileSpy = jest.spyOn(fileUploadService, 'deleteFile');
      const uploadSpy = jest.spyOn(fileUploadService, 'upload');

      const updateDto = {
        name: 'Test',
        mainPhone: TEST_USER_DATA.MAIN_PHONE,
        phone: TEST_USER_DATA.SECONDARY_PHONE,
        city: 'São Paulo',
        state: 'SP',
        profileKey: 'old-key-to-delete',
      };

      const mockFile = {
        originalname: 'test.jpg',
        buffer: Buffer.from('test'),
      };

      const response = await service.execute(
        userEntityMock() as any,
        updateDto as any,
        mockFile,
      );

      expect(response).toEqual({ message: 'User updated successfully' });
      expect(deleteFileSpy).toHaveBeenCalledWith('old-key-to-delete');
      expect(uploadSpy).toHaveBeenCalledWith(mockFile);
      expect(updateUserSpy).toHaveBeenCalled();
      expect(updateUserSpy).toBeCalledTimes(1);
    });

    it('should be able to update an user', async () => {
      userRepository.updateUser = jest.fn().mockResolvedValue(userMock());
      const updateUserSpy = jest.spyOn(userRepository, 'updateUser');

      const updateDto = {
        name: 'Test',
        mainPhone: TEST_USER_DATA.MAIN_PHONE,
        phone: TEST_USER_DATA.SECONDARY_PHONE,
        city: 'São Paulo',
        state: 'SP',
      };

      const response = await service.execute(
        userEntityMock() as any,
        updateDto as any,
        null,
      );
      expect(response).toEqual({ message: 'User updated successfully' });
      expect(updateUserSpy).toHaveBeenCalled();
      expect(updateUserSpy).toBeCalledTimes(1);
    });
    it('should be able to update an user when data has password ', async () => {
      userRepository.updateUser = jest.fn().mockResolvedValue(userMock());
      const updateUserSpy = jest.spyOn(userRepository, 'updateUser');
      const response = await service.execute(
        userEntityMock() as any,
        userUpdateMock() as any,
        null,
      );
      expect(response).toEqual({ message: 'User updated successfully' });
      expect(updateUserSpy).toHaveBeenCalled();
      expect(updateUserSpy).toBeCalledTimes(1);
    });
  });
});
