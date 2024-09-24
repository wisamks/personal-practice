import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from '../auth.service';
import { UserService } from '@_/user/user.service';
import { UserRepository } from '@_/user/user.repository';
import { JwtService, JwtSignOptions } from '@nestjs/jwt';
import { Redis } from 'ioredis';
import { ConfigService } from '@nestjs/config';
import { SignInReqDto } from '../dto/request/sign-in.req.dto';
import { User } from '@prisma/client';
import { ISignInOutput } from '../types/sign-in.output.interface';
import * as bcrypt from 'bcryptjs';
import { generateDatetime } from '@_/common/generate-datetime.util';
import { AuthBadRequestException } from '@_/common/custom-error.util';
import { IOauthUserOutput } from '../types/oauth-user.output.interface';
import { SignInResDto } from '../dto/response/sign-in.res.dto';
import { IProviderOptions } from '@_/user/types/provider-options.interface';
import { plainToInstance } from 'class-transformer';
import { GetUserResDto } from '@_/user/dto/response/get-user.res.dto';
import { CreateUserReqDto } from '@_/user/dto/request/create-user.req.dto';
import { CreateUserResDto } from '@_/user/dto/response/create-user.res.dto';
import { ONE_WEEK_BY_SECOND } from '@_/redis/constants/redis.constant';
import { SignUpReqDto } from '../dto/request/sign-up.req.dto';

describe('AuthService', () => {
  const mockConfigService: jest.Mocked<Partial<ConfigService>> = {
    get: jest.fn(),
  };

  const mockUserService: jest.Mocked<Partial<UserService>> = {
    getUserOauth: jest.fn(),
    createUser: jest.fn(),
    deleteRefresh: jest.fn(),
  };

  const mockUserRepository: jest.Mocked<Partial<UserRepository>> = {
    findUserByEmail: jest.fn(),
  };

  const mockJwtService: jest.Mocked<Partial<JwtService>> = {
    signAsync: jest.fn(),
  };

  const mockRedisClient: jest.Mocked<Partial<Redis>> = {
    get: jest.fn(),
    set: jest.fn(),
    del: jest.fn(),
  };

  let service: AuthService;
  let configService: jest.Mocked<ConfigService>;
  let userService: jest.Mocked<UserService>;
  let repository: jest.Mocked<UserRepository>;
  let jwtService: jest.Mocked<JwtService>;
  let redisClient: jest.Mocked<Redis>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
        {
          provide: UserService,
          useValue: mockUserService,
        },
        {
          provide: UserRepository,
          useValue: mockUserRepository,
        },
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
        {
          provide: 'REDIS-CLIENT',
          useValue: mockRedisClient,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    configService = module.get<jest.Mocked<ConfigService>>(ConfigService);
    userService = module.get<jest.Mocked<UserService>>(UserService);
    repository = module.get<jest.Mocked<UserRepository>>(UserRepository);
    jwtService = module.get<jest.Mocked<JwtService>>(JwtService);
    redisClient = module.get<jest.Mocked<Redis>>('REDIS-CLIENT');
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  const now = generateDatetime();
  const userId = 1;
  const accessToken = '123985qpowieyasldgh;ad';
  const refreshToken = '123985qpewiorhsdlkhsdf';
  const mockUser1: User = {
    id: 1,
    createdAt: now,
    updatedAt: now,
    deletedAt: null,
    email: 'mock1@mock.com',
    password: '1234',
    name: '몰랑이',
    provider: null,
    providerId: null,
    refreshToken: null,
  };
  const mockUser2: User = {
    id: 2,
    createdAt: now,
    updatedAt: now,
    deletedAt: null,
    email: 'mock2@naver.com',
    password: 'naver',
    name: '몰랑이',
    provider: 'naver',
    providerId: '1eru0wqt48tu',
    refreshToken: null,
  };
  const signInReqDto: SignInReqDto = {
    email: 'mock1@mock.com',
    password: '1234',
  };
  const refreshKey = `users:${userId}:refresh`;
  const refreshOptions: JwtSignOptions = {
    secret: 'mock-secret',
    expiresIn: '1h',
  };

  describe('validateUser, 입력: 로그인 데이터, 동작: 이메일과 비밀번호로 확인 후 유저 반환', () => {
    it('반환: 유저 아이디 객체, 조건: 로그인 성공', async () => {
      const signInResult: ISignInOutput = {
        userId: mockUser1.id,
      };
      const foundUser = mockUser1;
      repository.findUserByEmail.mockResolvedValue(mockUser1);
      jest.spyOn(bcrypt, 'compare').mockResolvedValue(true as never);

      await expect(service.validateUser(signInReqDto)).resolves.toEqual<ISignInOutput>(signInResult);
      expect(repository.findUserByEmail).toHaveBeenCalledWith<[string]>(signInReqDto.email);
      expect(bcrypt.compare).toHaveBeenCalledWith<[string, string]>(signInReqDto.password, foundUser.password);
    });

    it('반환: BadRequestError, 조건: 유저 없음', async () => {
      repository.findUserByEmail.mockResolvedValue(null);

      await expect(service.validateUser(signInReqDto)).rejects.toThrow(AuthBadRequestException);
      expect(repository.findUserByEmail).toHaveBeenCalledWith<[string]>(signInReqDto.email);
      expect(bcrypt.compare).not.toHaveBeenCalled();
    });

    it('반환: BadRequestError, 조건: 비밀번호 틀림', async () => {
      const foundUser = mockUser1;
      repository.findUserByEmail.mockResolvedValue(mockUser1);
      jest.spyOn(bcrypt, 'compare').mockResolvedValue(false as never);

      await expect(service.validateUser(signInReqDto)).rejects.toThrow(AuthBadRequestException);
      expect(repository.findUserByEmail).toHaveBeenCalledWith<[string]>(signInReqDto.email);
      expect(bcrypt.compare).toHaveBeenCalledWith<[string, string]>(signInReqDto.password, foundUser.password);
    });
  });

  describe('validateRefreshToken, 입력: 유저 아이디 & 리프레시 토큰, 동작: 레디스에서 리프레시 토큰 비교 결과 반환', () => {
    it('반환: 비교 결과 true, 조건: 리프레시 토큰 같음', async () => {
      jest.spyOn(bcrypt, 'compare').mockResolvedValue(true as never);
      redisClient.get.mockResolvedValue(refreshToken);

      await expect(service.validateRefreshToken({ userId, refreshToken })).resolves.toEqual<boolean>(true);
      expect(redisClient.get).toHaveBeenCalledWith<[string]>(refreshKey);
      expect(bcrypt.compare).toHaveBeenCalledWith<[string, string]>(refreshToken, refreshToken);
    });

    it('반환: 비교 결과 false, 조건: 리프레시 토큰 다름', async () => {
      jest.spyOn(bcrypt, 'compare').mockResolvedValue(false as never);
      redisClient.get.mockResolvedValue(refreshToken);

      await expect(service.validateRefreshToken({ userId, refreshToken })).resolves.toEqual<boolean>(false);
      expect(redisClient.get).toHaveBeenCalledWith<[string]>(refreshKey);
      expect(bcrypt.compare).toHaveBeenCalledWith<[string, string]>(refreshToken, refreshToken);
    });
  });

  describe('oauthLogin, 입력: Oauth 유저 데이터, 동작: 유저 찾아보고 없으면 만들어서 토큰 반환', () => {
    it('반환: 토큰들 객체, 조건: 유저를 못 찾았을 때, 동작: 유저 생성 후 토큰 반환', async () => {
      const tokens = { accessToken, refreshToken };
      const user: IOauthUserOutput = {
        email: 'mock2@naver.com',
        name: '몰랑이',
        provider: 'naver',
        providerId: mockUser2.providerId,
      };
      const mockRefreshKey = `users:2:refresh`;
      const createdUser = plainToInstance(CreateUserResDto, mockUser2);
      const payload: ISignInOutput = { userId: createdUser.userId };
      userService.getUserOauth.mockResolvedValue(null);
      userService.createUser.mockResolvedValue(createdUser);
      configService.get.mockReturnValueOnce('mock-secret');
      configService.get.mockReturnValueOnce('1h');
      jwtService.signAsync.mockResolvedValueOnce(accessToken);
      jwtService.signAsync.mockResolvedValueOnce(refreshToken);
      jest.spyOn(bcrypt, 'hash').mockResolvedValue(refreshToken as never);

      await expect(service.oauthLogin(user)).resolves.toEqual<SignInResDto>(tokens);
      expect(userService.getUserOauth).toHaveBeenCalledWith<[IProviderOptions]>({
        provider: user.provider,
        providerId: user.providerId,
      });
      expect(userService.createUser).toHaveBeenCalledWith<[CreateUserReqDto]>({
        ...user,
        password: user.provider,
      });
      expect(configService.get).toHaveBeenCalledWith<[string]>('JWT_REFRESH_TOKEN_SECRET');
      expect(configService.get).toHaveBeenCalledWith<[string]>('JWT_REFRESH_EXPIRE');
      expect(jwtService.signAsync).toHaveBeenCalledWith<[ISignInOutput]>(payload);
      expect(jwtService.signAsync).toHaveBeenCalledWith<[ISignInOutput, JwtSignOptions]>(payload, refreshOptions);
      expect(bcrypt.hash).toHaveBeenCalledWith<[string, number]>(refreshToken, 10);
      expect(redisClient.set).toHaveBeenCalledWith<[string, string, string, number]>(
        mockRefreshKey,
        refreshToken,
        'EX',
        ONE_WEEK_BY_SECOND,
      );
    });

    it('반환: 토큰들 객체, 조건: 유저 찾았을 때, 동작: 토큰 반환', async () => {
      const tokens = { accessToken, refreshToken };
      const user: IOauthUserOutput = {
        email: 'mock2@naver.com',
        name: '몰랑이',
        provider: 'naver',
        providerId: mockUser2.providerId,
      };
      const mockRefreshKey = `users:2:refresh`;
      const foundUser = plainToInstance(GetUserResDto, mockUser2);
      const payload: ISignInOutput = { userId: foundUser.userId };
      userService.getUserOauth.mockResolvedValue(foundUser);
      configService.get.mockReturnValueOnce('mock-secret');
      configService.get.mockReturnValueOnce('1h');
      jwtService.signAsync.mockResolvedValueOnce(accessToken);
      jwtService.signAsync.mockResolvedValueOnce(refreshToken);
      jest.spyOn(bcrypt, 'hash').mockResolvedValue(refreshToken as never);

      await expect(service.oauthLogin(user)).resolves.toEqual<SignInResDto>(tokens);
      expect(userService.getUserOauth).toHaveBeenCalledWith<[IProviderOptions]>({
        provider: user.provider,
        providerId: user.providerId,
      });
      expect(userService.createUser).not.toHaveBeenCalled();
      expect(configService.get).toHaveBeenCalledWith<[string]>('JWT_REFRESH_TOKEN_SECRET');
      expect(configService.get).toHaveBeenCalledWith<[string]>('JWT_REFRESH_EXPIRE');
      expect(jwtService.signAsync).toHaveBeenCalledWith<[ISignInOutput]>(payload);
      expect(jwtService.signAsync).toHaveBeenCalledWith<[ISignInOutput, JwtSignOptions]>(payload, refreshOptions);
      expect(bcrypt.hash).toHaveBeenCalledWith<[string, number]>(refreshToken, 10);
      expect(redisClient.set).toHaveBeenCalledWith<[string, string, string, number]>(
        mockRefreshKey,
        refreshToken,
        'EX',
        ONE_WEEK_BY_SECOND,
      );
    });
  });

  describe('signIn, 입력: 로그인 데이터, 동작: 토큰 반환', () => {
    it('반환: 토큰들 객체, 조건: 로그인 성공', async () => {
      const tokens = { accessToken, refreshToken };
      const mockRefreshKey = `users:2:refresh`;
      const foundUser = plainToInstance(GetUserResDto, mockUser2);
      const payload: ISignInOutput = { userId: foundUser.userId };
      jest.spyOn(service, 'validateUser').mockResolvedValue(payload);
      configService.get.mockReturnValueOnce('mock-secret');
      configService.get.mockReturnValueOnce('1h');
      jwtService.signAsync.mockResolvedValueOnce(accessToken);
      jwtService.signAsync.mockResolvedValueOnce(refreshToken);
      jest.spyOn(bcrypt, 'hash').mockResolvedValue(refreshToken as never);

      await expect(service.signIn(signInReqDto)).resolves.toEqual<SignInResDto>(tokens);
      expect(service.validateUser).toHaveBeenCalledWith<[SignInReqDto]>(signInReqDto);
      expect(configService.get).toHaveBeenCalledWith<[string]>('JWT_REFRESH_TOKEN_SECRET');
      expect(configService.get).toHaveBeenCalledWith<[string]>('JWT_REFRESH_EXPIRE');
      expect(jwtService.signAsync).toHaveBeenCalledWith<[ISignInOutput]>(payload);
      expect(jwtService.signAsync).toHaveBeenCalledWith<[ISignInOutput, JwtSignOptions]>(payload, refreshOptions);
      expect(bcrypt.hash).toHaveBeenCalledWith<[string, number]>(refreshToken, 10);
      expect(redisClient.set).toHaveBeenCalledWith<[string, string, string, number]>(
        mockRefreshKey,
        refreshToken,
        'EX',
        ONE_WEEK_BY_SECOND,
      );
    });
  });

  describe('signOut, 입력: 유저 아이디, 동작: 저장된 리프레시 토큰 삭제', () => {
    it('반환: undefined, 조건: 항상', async () => {
      await expect(service.signOut(userId)).resolves.toEqual<void>(undefined);
      expect(redisClient.del).toHaveBeenCalledWith(refreshKey);
    });
  });

  describe('signUp, 입력: 회원가입 데이터, 동작: 데이터 전달 후 생성된 유저 반환', () => {
    it('반환: 생성된 유저 아이디 객체, 조건: 항상', async () => {
      const createdUser: CreateUserResDto = plainToInstance(CreateUserResDto, mockUser1);
      const signUpReqDto: SignUpReqDto = {
        email: 'mock1@mock.com',
        name: '몰랑이',
        password: '1234',
      };
      userService.createUser.mockResolvedValue(createdUser);

      await expect(service.signUp(signUpReqDto)).resolves.toEqual<CreateUserResDto>(createdUser);
      expect(userService.createUser).toHaveBeenCalledWith<[SignUpReqDto]>(signUpReqDto);
    });
  });

  describe('getAccessToken, 입력: 유저 아이디, 동작: 액세스 토큰 생성 후 반환', () => {
    it('반환: 액세스 토큰 문자열, 조건: 항상', async () => {
      const payload: ISignInOutput = { userId };
      jwtService.signAsync.mockResolvedValue(accessToken);

      await expect(service.getAccessToken(userId)).resolves.toEqual<string>(accessToken);
      expect(jwtService.signAsync).toHaveBeenCalledWith<[ISignInOutput]>(payload);
    });
  });
});
