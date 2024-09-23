import { Test, TestingModule } from "@nestjs/testing";
import { AuthService } from "../auth.service";
import { UserService } from "@_/user/user.service";
import { UserRepository } from "@_/user/user.repository";
import { JwtService } from "@nestjs/jwt";
import { Redis } from "ioredis";
import { ConfigService } from "@nestjs/config";
import { SignInReqDto } from "../dto/request/sign-in.req.dto";
import { User } from "@prisma/client";
import { ISignInOutput } from "../types/sign-in.output.interface";
import * as bcrypt from 'bcryptjs';
import { generateDatetime } from "@_/common/generate-datetime.util";

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
    });
});