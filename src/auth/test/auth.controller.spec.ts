import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from '../auth.controller';
import { AuthService } from '../auth.service';
import { IOauthUserOutput } from '../types/oauth-user.output.interface';
import { CookieOptions, Response } from 'express';
import { COOKIE_OPTIONS } from '../constants/auth.constants';
import { SignInReqDto } from '../dto/request/sign-in.req.dto';
import { CreateUserResDto } from '@_/user/dto/response/create-user.res.dto';
import { User } from '@prisma/client';
import { generateDatetime } from '@_/common/generate-datetime.util';
import { plainToInstance } from 'class-transformer';
import { SignUpReqDto } from '../dto/request/sign-up.req.dto';

describe('AuthController', () => {
  const mockAuthService: jest.Mocked<Partial<AuthService>> = {
    oauthLogin: jest.fn(),
    signIn: jest.fn(),
    signOut: jest.fn(),
    signUp: jest.fn(),
    getAccessToken: jest.fn(),
  };

  const mockRes: jest.Mocked<Partial<Response>> = {
    cookie: jest.fn(),
    end: jest.fn(),
    clearCookie: jest.fn(),
  };

  let controller: AuthController;
  let service: jest.Mocked<AuthService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: mockAuthService,
        },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    service = module.get<jest.Mocked<AuthService>>(AuthService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  const now = generateDatetime();
  const userId = 1;
  const accessToken = 'qpweoity1qpweityqe';
  const refreshToken = 'qpweityqpweoitqpweio';
  const mockReqUser1: IOauthUserOutput = {
    email: 'mock1@kakao.com',
    name: '몰랑이',
    provider: 'kakao',
    providerId: '1238561810384',
  };
  const mockReqUser2: IOauthUserOutput = {
    email: 'mock2@google.com',
    name: '몰랑이',
    provider: 'google',
    providerId: '123951034659',
  };
  const mockReqUser3: IOauthUserOutput = {
    email: 'mock3@naver.com',
    name: '몰랑이',
    provider: 'naver',
    providerId: '0198605168934',
  };
  const mockUser1: User = {
    id: 1,
    createdAt: now,
    updatedAt: now,
    deletedAt: null,
    email: 'mock1@kakao.com',
    password: 'kakao',
    name: '몰랑이',
    provider: 'kakao',
    providerId: mockReqUser1.providerId,
    refreshToken: null,
  };

  describe('kakaoCallback, 입력: oauth 유저 데이터 & 응답 객체, 동작: 토큰을 받아 쿠키에 저장', () => {
    it('반환: undefined, 조건: 항상', async () => {
      service.oauthLogin.mockResolvedValue({ accessToken, refreshToken });

      await expect(controller.kakaoCallback(mockReqUser1, mockRes as Response)).resolves.toEqual<void>(undefined);
      expect(service.oauthLogin).toHaveBeenCalledWith<[IOauthUserOutput]>(mockReqUser1);
      expect(mockRes.cookie).toHaveBeenCalledWith<[string, string, CookieOptions]>(
        COOKIE_OPTIONS.ACCESS_TOKEN,
        accessToken,
        {
          httpOnly: true,
          maxAge: COOKIE_OPTIONS.ONE_HOUR_BY_MS,
        },
      );
      expect(mockRes.cookie).toHaveBeenCalledWith<[string, string, CookieOptions]>(
        COOKIE_OPTIONS.REFRESH_TOKEN,
        refreshToken,
        {
          httpOnly: true,
          maxAge: COOKIE_OPTIONS.ONE_WEEK_BY_MS,
        },
      );
    });
  });

  describe('naverCallback, 입력: oauth 유저 데이터 & 응답 객체, 동작: 토큰을 받아 쿠키에 저장', () => {
    it('반환: undefined, 조건: 항상', async () => {
      service.oauthLogin.mockResolvedValue({ accessToken, refreshToken });

      await expect(controller.naverCallback(mockReqUser3, mockRes as Response)).resolves.toEqual<void>(undefined);
      expect(service.oauthLogin).toHaveBeenCalledWith<[IOauthUserOutput]>(mockReqUser3);
      expect(mockRes.cookie).toHaveBeenCalledWith<[string, string, CookieOptions]>(
        COOKIE_OPTIONS.ACCESS_TOKEN,
        accessToken,
        {
          httpOnly: true,
          maxAge: COOKIE_OPTIONS.ONE_HOUR_BY_MS,
        },
      );
      expect(mockRes.cookie).toHaveBeenCalledWith<[string, string, CookieOptions]>(
        COOKIE_OPTIONS.REFRESH_TOKEN,
        refreshToken,
        {
          httpOnly: true,
          maxAge: COOKIE_OPTIONS.ONE_WEEK_BY_MS,
        },
      );
    });
  });

  describe('googleCallback, 입력: oauth 유저 데이터 & 응답 객체, 동작: 토큰을 받아 쿠키에 저장', () => {
    it('반환: undefined, 조건: 항상', async () => {
      service.oauthLogin.mockResolvedValue({ accessToken, refreshToken });

      await expect(controller.googleCallback(mockReqUser2, mockRes as Response)).resolves.toEqual<void>(undefined);
      expect(service.oauthLogin).toHaveBeenCalledWith<[IOauthUserOutput]>(mockReqUser2);
      expect(mockRes.cookie).toHaveBeenCalledWith<[string, string, CookieOptions]>(
        COOKIE_OPTIONS.ACCESS_TOKEN,
        accessToken,
        {
          httpOnly: true,
          maxAge: COOKIE_OPTIONS.ONE_HOUR_BY_MS,
        },
      );
      expect(mockRes.cookie).toHaveBeenCalledWith<[string, string, CookieOptions]>(
        COOKIE_OPTIONS.REFRESH_TOKEN,
        refreshToken,
        {
          httpOnly: true,
          maxAge: COOKIE_OPTIONS.ONE_WEEK_BY_MS,
        },
      );
    });
  });

  describe('signIn, 입력: 유저 로그인 데이터 & 응답 객체, 동작: 토큰을 받아 쿠키에 저장', () => {
    it('반환: 응답 객체, 조건: 항상', async () => {
      const signInReqDto: SignInReqDto = {
        email: mockReqUser1.email,
        password: mockReqUser1.provider,
      };
      service.signIn.mockResolvedValue({ accessToken, refreshToken });
      mockRes.end.mockReturnValue(undefined as Response);

      await expect(controller.signIn(signInReqDto, mockRes as Response)).resolves.toEqual<Response>(mockRes.end());
      expect(service.signIn).toHaveBeenCalledWith<[SignInReqDto]>(signInReqDto);
      expect(mockRes.cookie).toHaveBeenCalledWith<[string, string, CookieOptions]>(
        COOKIE_OPTIONS.ACCESS_TOKEN,
        accessToken,
        {
          httpOnly: true,
          maxAge: COOKIE_OPTIONS.ONE_HOUR_BY_MS,
        },
      );
      expect(mockRes.cookie).toHaveBeenCalledWith<[string, string, CookieOptions]>(
        COOKIE_OPTIONS.REFRESH_TOKEN,
        refreshToken,
        {
          httpOnly: true,
          maxAge: COOKIE_OPTIONS.ONE_WEEK_BY_MS,
        },
      );
    });
  });

  describe('signOut, 입력: 유저 아이디 & 응답 객체, 동작: 로그아웃 및 쿠키 삭제', () => {
    it('반환: 응답 객체, 조건: 항상', async () => {
      await expect(controller.signOut(mockRes as Response, userId)).resolves.toEqual<Response>(mockRes.end());
      expect(service.signOut).toHaveBeenCalledWith<[number]>(userId);
      expect(mockRes.clearCookie).toHaveBeenCalledWith<[string]>(COOKIE_OPTIONS.ACCESS_TOKEN);
      expect(mockRes.clearCookie).toHaveBeenCalledWith<[string]>(COOKIE_OPTIONS.REFRESH_TOKEN);
    });
  });

  describe('signUp, 입력: 회원가입 데이터, 동작: 데이터 전달 후 생성된 유저 반환', () => {
    it('반환: 생성된 유저 객체, 조건: 항상', async () => {
      const createdUser = plainToInstance(CreateUserResDto, mockUser1);
      const signUpReqDto: SignUpReqDto = {
        email: mockUser1.email,
        name: mockUser1.name,
        password: mockUser1.password,
      };
      service.signUp.mockResolvedValue(createdUser);

      await expect(controller.signUp(signUpReqDto)).resolves.toEqual<CreateUserResDto>(createdUser);
      expect(service.signUp).toHaveBeenCalledWith<[SignUpReqDto]>(signUpReqDto);
    });
  });

  describe('getAccessFromRefresh, 입력: 응답 객체 & 유저 아이디, 동작: 액세스 토큰 획득 후 쿠키에 저장', () => {
    it('반환: 응답 객체, 조건: 항상', async () => {
      service.getAccessToken.mockResolvedValue(accessToken);
      mockRes.end.mockReturnValue(undefined as Response);

      await expect(controller.getAccessFromRefresh(mockRes as Response, userId)).resolves.toEqual<Response>(
        mockRes.end(),
      );
      expect(service.getAccessToken).toHaveBeenCalledWith<[number]>(userId);
      expect(mockRes.cookie).toHaveBeenCalledWith<[string, string, CookieOptions]>(
        COOKIE_OPTIONS.ACCESS_TOKEN,
        accessToken,
        {
          httpOnly: true,
          maxAge: COOKIE_OPTIONS.ONE_HOUR_BY_MS,
        },
      );
    });
  });
});
