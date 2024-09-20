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
import { HttpException } from "@nestjs/common";

describe('UserService', () => {
  let service: UserService;
  let repository: jest.Mocked<UserRepository>;

  const mockUserRepository: jest.Mocked<Partial<UserRepository>> = {
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

  const now = new Date();
  
  const mockUser1: User = {
    id: 1,
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
    email: 'mock1@mock.com',
    password: '1234',
    name: '모의유저1',
    refreshToken: 'asdlghqpoewifjasdf',
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
      ],
    }).compile();

    service = module.get<UserService>(UserService);
    repository = module.get<jest.Mocked<UserRepository>>(UserRepository);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getUsers, 입력: 없음, 동작: 전체 유저 배열 반환', () => {
    it('반환: 전체 유저 객체의 배열, 조건: 항상', async () => {
      const users = [mockUser1, mockUser2];
      repository.findUsers.mockResolvedValue(users);
      const output = plainToInstance(GetUserResDto, users);

      await expect(service.getUsers()).resolves.toEqual<GetUserResDto[]>(output);
      expect(repository.findUsers).toHaveBeenCalledWith<[void]>();
    })
  });

  describe('getUser, 입력: 유저 아이디, 동작: 단일 유저 반환', () => {
    it('반환: 단일 유저 객체, 조건: db에 해당 아이디가 있을 때', async () => {
      const user = mockUser1;
      const userId = 1;
      const output = plainToInstance(GetUserResDto, user);
      repository.findUserById.mockResolvedValue(user);

      await expect(service.getUser(userId)).resolves.toEqual<GetUserResDto>(output);
      expect(repository.findUserById).toHaveBeenCalledWith<[number]>(userId);
    });

    it('반환: 404 에러, 조건: db에 해당 아이디가 없을 때', async () => {
      const userId = 100;
      repository.findUserById.mockResolvedValue(null);

      await expect(service.getUser(userId)).rejects.toThrow(UserNotFoundException);
      expect(repository.findUserById).toHaveBeenCalledWith<[number]>(userId);
    })
  })

  describe('getUserOauth, 입력: Oauth provider 옵션, 동작: Oauth 정보에 맞는 단일 유저 반환', () => {
    it('반환: 단일 유저 객체, 조건: db에 Oauth provider 옵션과 일치하는 유저가 있을 때', async () => {
      const user = mockUser1;
      const output = plainToInstance(GetUserResDto, user);
      const providerOptions: IProviderOptions = {
        provider: 'google',
        providerId: '1029385618932',
      };
      repository.findUserByProviderOptions.mockResolvedValue(user);

      await expect(service.getUserOauth(providerOptions)).resolves.toEqual<GetUserResDto>(output);
      expect(repository.findUserByProviderOptions).toHaveBeenCalledWith<[IProviderOptions]>(providerOptions);
    })

    it('반환: null, 조건: db에 Oauth provider 옵션과 일치하는 유저가 없을 때', async () => {
      const user = null;
      const output = null;
      const providerOptions: IProviderOptions = {
        provider: 'kakao',
        providerId: '1029385618932',
      };
      repository.findUserByProviderOptions.mockResolvedValue(null);
      
      expect(await service.getUserOauth(providerOptions)).toEqual<GetUserResDto>(output);
      expect(repository.findUserByProviderOptions).toHaveBeenCalledWith<[IProviderOptions]>(providerOptions);
    });
  });

  describe('getRefreshToken, 입력: 유저 아이디, 동작: 단일 유저의 리프레시 토큰 반환', () => {
    it('반환: 리프레시 토큰 문자열, 조건: 유저 아이디로 찾아서 토큰이 있으면', async () => {
      const userId = 1;
      const user = mockUser1;
      repository.findUserById.mockResolvedValue(user);

      await expect(service.getRefreshToken(userId)).resolves.toEqual<string>(user.refreshToken);
      expect(repository.findUserById).toHaveBeenCalledWith<[number]>(userId);
    });

    it('반환: null, 조건: 유저 아이디로 찾아서 토큰이 없으면', async () => {
      const userId = 2;
      const user = mockUser2;
      repository.findUserById.mockResolvedValue(user);

      await expect(service.getRefreshToken(userId)).resolves.toEqual<string|null>(user.refreshToken);
      expect(repository.findUserById).toHaveBeenCalledWith<[number]>(userId);
    });

    it('반환: 404에러, 조건: 유저 아이디로 찾아서 유저가 없으면', async () => {
      const userId = 99;
      const user = null;
      repository.findUserById.mockResolvedValue(user);

      await expect(service.getRefreshToken(userId)).rejects.toThrow(UserNotFoundException);
      expect(repository.findUserById).toHaveBeenCalledWith<[number]>(userId);
    });
  });
  
  describe('createUser, 입력: 유저 생성 dto, 동작: 단일 유저 생성', () => {
    it('반환: 단일 유저 아이디 객체, 조건: 생성했다면', async () => {
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

      expect(repository.findUserByEmail).toHaveBeenCalledWith<[string]>(createUserReqDto.email);
      expect(bcrypt.hash).toHaveBeenCalledWith<[string, number]>(createUserReqDto.password, 10);
      expect(repository.createUser).toHaveBeenCalledWith<[CreateUserReqDto]>({
        ...createUserReqDto,
        password: hashedPassword,
      });
    });
    
    it('반환: ConflictError, 조건: 해당 이메일로 찾았을 때 이미 db에 있다면', async () => {
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
      expect(repository.findUserByEmail).toHaveBeenCalledWith<[string]>(createUserReqDto.email);
    });
  });

  describe('updateUser, 입력: 유저 수정 dto, 동작: 단일 유저 수정', () => {
    it('반환: undefined, 조건: 수정 성공', async () => {
      const userId = 1;
      const updateUserReqDto: UpdateUserReqDto = {
        name: '몰랑이',
      };
      repository.findUserByEmail.mockResolvedValue(null);
      repository.updateUser.mockResolvedValue({ count: 1 });

      await expect(service.updateUser({ updateUserReqDto, userId })).resolves.toEqual<void>(undefined);
      expect(repository.updateUser).toHaveBeenCalledWith<[{updateUserReqDto: UpdateUserReqDto, userId: number}]>({ updateUserReqDto, userId });
    });

    it('반환: ConflictError, 조건: 수정하려는 이메일로 db에서 다른 유저를 찾았다면', async () => {
      const userId = 1;
      const updateUserReqDto: UpdateUserReqDto = {
        email: mockUser2.email,
      };
      repository.findUserByEmail.mockResolvedValue(mockUser2);

      await expect(service.updateUser({ updateUserReqDto, userId })).rejects.toThrow(UserConflictEmailException);
      expect(repository.findUserByEmail).toHaveBeenCalledWith<[string]>(updateUserReqDto.email);
    });

    it('반환: NotFoundError, 조건: 유저 아이디로 db에서 찾지 못했다면', async () => {
      const userId = 99;
      const updateUserReqDto: UpdateUserReqDto = {
        name: '몰랑이',
      };
      repository.updateUser.mockResolvedValue({ count: 0 });
      repository.findUserById.mockResolvedValue(null);

      await expect(service.updateUser({ updateUserReqDto, userId })).rejects.toThrow(UserNotFoundException);
      expect(repository.updateUser).toHaveBeenCalledWith<[{ updateUserReqDto: UpdateUserReqDto, userId: number }]>({ updateUserReqDto, userId });
      expect(repository.findUserById).toHaveBeenCalledWith<[number]>(userId);
    });
  });

  describe('deleteUser, 입력: 유저 아이디, 동작: 단일 유저 삭제', () => {
    it('반환: undefined, 조건: 삭제 성공', async () => {
      const userId = 1;
      repository.deleteUser.mockResolvedValue({ count: 1 });

      await expect(service.deleteUser(userId)).resolves.toEqual<void>(undefined);
      expect(repository.deleteUser).toHaveBeenCalled();
    });

    it('반환: NotFoundError, 조건: 유저 아이디로 db에서 찾지 못했다면', async () => {
      const userId = 99;
      repository.deleteUser.mockResolvedValue({ count: 0 });
      repository.findUserById.mockResolvedValue(null);

      await expect(service.deleteUser(userId)).rejects.toThrow(UserNotFoundException);
      expect(repository.deleteUser).toHaveBeenCalled();
      expect(repository.findUserById).toHaveBeenCalledWith<[number]>(userId);
    });
  });

  describe('createRefresh, 입력: 유저아이디&리프레시 토큰, 동작: 리프레시 토큰을 유저 테이블에 저장', () => {
    it('반환: undefined, 조건: 리프레시 토큰 db에 저장 성공', async () => {
      const userId = 1;
      const refreshToken = 'asdgqjefasdahkdjqwejf';
      repository.updateUserCreateRefresh.mockResolvedValue({ count: 1 });

      await expect(service.createRefresh({ userId, refreshToken })).resolves.toEqual<void>(undefined);
      expect(repository.updateUserCreateRefresh).toHaveBeenCalledWith<[{ userId: number, refreshToken: string }]>({ userId, refreshToken });
    });

    it('반환: NotFoundError, 조건: 유저를 찾지 못했다면', async () => {
      const userId = 99;
      const refreshToken = 'as;dlgahsfjqowief;askdg';
      repository.updateUserCreateRefresh.mockResolvedValue({ count: 0 });
      repository.findUserById.mockResolvedValue(null);

      await expect(service.createRefresh({ userId, refreshToken })).rejects.toThrow(UserNotFoundException);
      expect(repository.updateUserCreateRefresh).toHaveBeenCalledWith<[{ userId: number, refreshToken: string }]>({ userId, refreshToken });
      expect(repository.findUserById).toHaveBeenCalledWith<[number]>(userId);
    });
  });

  describe('deleteRefresh, 입력: 유저 아이디, 동작: 리프레시 토큰을 유저 테이블에서 삭제', () => {
    it('반환: undefined, 조건: 리프레시 토큰 db에서 삭제 성공', async () => {
      const userId = 1;
      repository.updateUserDeleteRefresh.mockResolvedValue({ count: 1 });

      await expect(service.deleteRefresh(userId)).resolves.toEqual<void>(undefined);
      expect(repository.updateUserDeleteRefresh).toHaveBeenCalledWith<[number]>(userId);
    })

    it('반환: NotFoundError, 조건: 유저를 찾지 못했다면', async () => {
      const userId = 99;
      repository.updateUserDeleteRefresh.mockResolvedValue({ count: 0 });
      repository.findUserById.mockResolvedValue(null);

      await expect(service.deleteRefresh(userId)).rejects.toThrow(UserNotFoundException);
      expect(repository.updateUserDeleteRefresh).toHaveBeenCalledWith<[number]>(userId);
      expect(repository.findUserById).toHaveBeenCalledWith<[number]>(userId);
    });
  });
})