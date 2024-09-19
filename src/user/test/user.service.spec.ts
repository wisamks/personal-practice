import { Test, TestingModule } from "@nestjs/testing";
import { UserRepository } from "../user.repository";
import { UserService } from "../user.service";
import { User } from "@prisma/client";
import { PrismaService } from "@_/prisma/prisma.service";
import { plainToInstance } from "class-transformer";
import { GetUserResDto } from "../dto/response/get-user.res.dto";
import { UserConflictEmailException, UserNotFoundException } from "@_/common/custom-error.util";
import { IProviderOptions } from "../types/provider-options.interface";
import * as bcrypt from 'bcryptjs';
import { CreateUserReqDto } from "../dto/request/create-user.req.dto";
import { UpdateUserReqDto } from "../dto/request/update-user.req.dto";

describe('UserService', () => {
  let service: UserService;
  let repository: jest.Mocked<UserRepository>;

  const mockUserRepository: jest.Mocked<Omit<UserRepository, 'logger' | 'prismaService'>> = {
    findUsers: jest.fn(),
    findUserById: jest.fn(),
    findUserByEmail: jest.fn(),
    findUserByProviderOptions: jest.fn(),
    createUser: jest.fn(),
    updateUser: jest.fn(),
    deleteUser: jest.fn(),
    updateUserCreateRefresh: jest.fn(),
    updateUserDeleteRefresh: jest.fn(),
  };

  const mockPrismaService: jest.Mocked<any> = {
    user: {
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    $transaction: jest.fn(),
  }
  
  const mockUser1: User = {
    id: 1,
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
    email: 'mock1@mock.com',
    password: '1234',
    name: '모의유저1',
    refreshToken: null,
    provider: 'google',
    providerId: '1029385618932',
  };

  const mockUser2: User = {
    id: 2,
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
    email: 'mock2@mock.com',
    password: '1234',
    name: '모의유저2',
    refreshToken: null,
    provider: 'naver',
    providerId: '1029385618932',
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserService,
        {
          provide: UserRepository,
          useValue: mockUserRepository,
        },
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        }
      ],
    }).compile();

    service = module.get<UserService>(UserService);
    repository = module.get<jest.Mocked<UserRepository>>(UserRepository);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getUsers', () => {
    it('return users if found', async () => {
      const users = [mockUser1, mockUser2];
      repository.findUsers.mockResolvedValue(users);
      const output = plainToInstance(GetUserResDto, users);

      const foundUsers = await service.getUsers();
      expect(repository.findUsers).toHaveBeenCalledWith<[void]>();
      expect(foundUsers).toEqual(output);
    })
  });

  describe('getUser', () => {
    it('return user if found', async () => {
      const user = mockUser1;
      const userId = 1;
      const output = plainToInstance(GetUserResDto, user);
      repository.findUserById.mockResolvedValue(user);

      await expect(service.getUser(userId)).resolves.toEqual(output);
      expect(repository.findUserById).toHaveBeenCalledWith<[number]>(userId);
    });

    it('throw NotFoundError if not found', async () => {
      const userId = 100;
      repository.findUserById.mockResolvedValue(null);

      await expect(service.getUser(userId)).rejects.toThrow(UserNotFoundException);
      expect(repository.findUserById).toHaveBeenCalledWith<[number]>(userId);
    })
  })

  describe('getUserOauth', () => {
    it('return user', async () => {
      const user = mockUser1;
      const output = plainToInstance(GetUserResDto, user);
      const providerOptions: IProviderOptions = {
        provider: 'google',
        providerId: '1029385618932',
      };
      repository.findUserByProviderOptions.mockResolvedValue(user);

      await expect(service.getUserOauth(providerOptions)).resolves.toEqual(output);
      expect(repository.findUserByProviderOptions).toHaveBeenCalledWith<[IProviderOptions]>(providerOptions);
    })
  });

  describe('getRefreshToken', () => {
    it('return refreshToken if found', async () => {
      const userId = 1;
      const user = mockUser1;
      repository.findUserById.mockResolvedValue(user);

      await expect(service.getRefreshToken(userId)).resolves.toEqual(user.refreshToken);
      expect(repository.findUserById).toHaveBeenCalledWith<[number]>(userId);
    });
  });
  
  describe('createUser', () => {
    it('return userId if created', async () => {
      const hashedPassword = await bcrypt.hash(mockUser1.password, 10);
      jest.spyOn(bcrypt, 'hash').mockResolvedValue(hashedPassword as never);
      const user = {
        ...mockUser1,
        password: hashedPassword
      };
      const createUserReqDto: CreateUserReqDto = {
        email: 'mock1@mock.com',
        password: '1234',
        name: '모의유저1',
        provider: 'google',
        providerId: '1029385618932',
      };
      repository.findUserByEmail(null);
      repository.createUser.mockResolvedValue(user);

      await service.createUser(createUserReqDto);

      expect(repository.findUserByEmail).toHaveBeenCalledWith(createUserReqDto.email);
      expect(bcrypt.hash).toHaveBeenCalledWith(createUserReqDto.password, 10);
      expect(repository.createUser).toHaveBeenCalledWith({
        ...createUserReqDto,
        password: hashedPassword,
      });
    });
    
    it('throw ConflictError if conflict email', async () => {
      const hashedPassword = await bcrypt.hash(mockUser1.password, 10);
      const user = {
        ...mockUser1,
        password: hashedPassword,
      };
      const createUserReqDto: CreateUserReqDto = {
        email: 'mock1@mock.com',
        password: '1234',
        name: '모의유저1',
        provider: 'google',
        providerId: '1029385618932',
      };
      repository.findUserByEmail.mockResolvedValue({
        ...mockUser2,
        email: mockUser1.email,
      });

      await expect(service.createUser(createUserReqDto)).rejects.toThrow(UserConflictEmailException);
      expect(repository.findUserByEmail).toHaveBeenCalledWith(createUserReqDto.email);
    });
  });

  describe('updateUser', () => {
    it('return void', async () => {
      const userId = 1;
      const updateUserReqDto: UpdateUserReqDto = {
        name: '몰랑이',
      };
      repository.findUserByEmail.mockResolvedValue(null);
      repository.updateUser.mockResolvedValue({ count: 1 });

      await expect(service.updateUser({ updateUserReqDto, userId })).resolves.toEqual(undefined);
      expect(repository.updateUser).toHaveBeenCalledWith({ updateUserReqDto, userId });
    });

    it('throw ConflictError if found Email', async () => {
      const userId = 1;
      const updateUserReqDto: UpdateUserReqDto = {
        email: mockUser2.email,
      };
      repository.findUserByEmail.mockResolvedValue(mockUser2);

      await expect(service.updateUser({ updateUserReqDto, userId })).rejects.toThrow(UserConflictEmailException);
      expect(repository.findUserByEmail).toHaveBeenCalledWith(updateUserReqDto.email);
    });

    it('throw NotFoundError if not found', async () => {
      const userId = 99;
      const updateUserReqDto: UpdateUserReqDto = {
        name: '몰랑이',
      };
      repository.updateUser.mockResolvedValue({ count: 0 });
      repository.findUserById.mockResolvedValue(null);

      await expect(service.updateUser({ updateUserReqDto, userId })).rejects.toThrow(UserNotFoundException);
      expect(repository.updateUser).toHaveBeenCalledWith({ updateUserReqDto, userId });
      expect(repository.findUserById).toHaveBeenCalledWith(userId);
    });
  });

  describe('deleteUser', () => {
    it('return void', async () => {
      const userId = 1;
      repository.deleteUser.mockResolvedValue({ count: 1 });

      await expect(service.deleteUser(userId)).resolves.toEqual(undefined);
      expect(repository.deleteUser).toHaveBeenCalledWith(userId);
    });

    it('throw NotFoundError if not found', async () => {
      const userId = 99;
      repository.deleteUser.mockResolvedValue({ count: 0 });
      repository.findUserById.mockResolvedValue(null);

      await expect(service.deleteUser(userId)).rejects.toThrow(UserNotFoundException);
      expect(repository.deleteUser).toHaveBeenCalledWith(userId);
      expect(repository.findUserById).toHaveBeenCalledWith(userId);
    });
  });

  describe('createRefresh', () => {
    it('return void', async () => {
      const userId = 1;
      const refreshToken = 'asdgqjefasdahkdjqwejf';
      repository.updateUserCreateRefresh.mockResolvedValue({ count: 1 });

      await expect(service.createRefresh({ userId, refreshToken })).resolves.toEqual(undefined);
      expect(repository.updateUserCreateRefresh).toHaveBeenCalledWith({ userId, refreshToken });
    });

    it('throw NotFoundError if not found', async () => {
      const userId = 99;
      const refreshToken = 'as;dlgahsfjqowief;askdg';
      repository.updateUserCreateRefresh.mockResolvedValue({ count: 0 });
      repository.findUserById.mockResolvedValue(null);

      await expect(service.createRefresh({ userId, refreshToken })).rejects.toThrow(UserNotFoundException);
      expect(repository.updateUserCreateRefresh).toHaveBeenCalledWith({ userId, refreshToken });
      expect(repository.findUserById).toHaveBeenCalledWith(userId);
    });
  });

  describe('deleteRefresh', () => {
    it('return void', async () => {
      const userId = 1;
      repository.updateUserDeleteRefresh.mockResolvedValue({ count: 1 });

      await expect(service.deleteRefresh(userId)).resolves.toEqual(undefined);
      expect(repository.updateUserDeleteRefresh).toHaveBeenCalledWith(userId);
    })

    it('throw NotFoundError if not found', async () => {
      const userId = 99;
      repository.updateUserDeleteRefresh.mockResolvedValue({ count: 0 });
      repository.findUserById.mockResolvedValue(null);

      await expect(service.deleteRefresh(userId)).rejects.toThrow(UserNotFoundException);
      expect(repository.updateUserDeleteRefresh).toHaveBeenCalledWith(userId);
      expect(repository.findUserById).toHaveBeenCalledWith(userId);
    });
  });
})