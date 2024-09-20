import { Test, TestingModule } from "@nestjs/testing";
import { UserService } from "../user.service";
import { UserController } from "../user.controller";
import { GetUserResDto } from "../dto/response/get-user.res.dto";
import { User } from "@prisma/client";
import { plainToInstance } from "class-transformer";
import { CreateUserReqDto } from "../dto/request/create-user.req.dto";
import { CreateUserResDto } from "../dto/response/create-user.res.dto";
import { UpdateUserReqDto } from "../dto/request/update-user.req.dto";

describe('UserController', () => {
    const mockUserService: jest.Mocked<Omit<UserService, 'logger' | 'userRepository'>> = {
        getUsers: jest.fn(),
        getUser: jest.fn(),
        getUserOauth: jest.fn(),
        getRefreshToken: jest.fn(),
        createUser: jest.fn(),
        updateUser: jest.fn(),
        deleteUser: jest.fn(),
        createRefresh: jest.fn(),
        deleteRefresh: jest.fn(),
    };

    const mockUser1: User = {
        id: 1,
        email: 'mock1@mock.com',
        name: '몰랑이',
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
        password: '1234',
        provider: 'google',
        providerId: '12349810485',
        refreshToken: null,
    };

    const mockUser2: User = {
        id: 2,
        email: 'mock2@mock.com',
        name: '몰랑잉',
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
        password: '1234',
        provider: 'naver',
        providerId: '1039856018346',
        refreshToken: null,
    };

    let controller: UserController;
    let service: jest.Mocked<UserService>;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            controllers: [UserController],
            providers: [
                {
                    provide: UserService,
                    useValue: mockUserService,
                }
            ],
        }).compile();

        controller = module.get<UserController>(UserController);
        service = module.get<jest.Mocked<UserService>>(UserService);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('getUsers, 입력: 없음, 동작: 전체 유저 목록 반환', () => {
        it('반환: 전체 유저 객체 배열, 조건: 항상', async () => {
            const users = plainToInstance(GetUserResDto, [mockUser1, mockUser2]);
            service.getUsers.mockResolvedValue(users);

            await expect(controller.getUsers()).resolves.toEqual<GetUserResDto[]>(users);
            expect(service.getUsers).toHaveBeenCalled();
        });
    });

    describe('getUser, 입력: 유저 아이디, 동작: 유저 아이디 전달 후 단일 유저 정보 반환', () => {
        it('반환: 단일 유저 객체, 조건: 찾았다면', async () => {
            const userId = 1;
            const user = plainToInstance(GetUserResDto, mockUser1);
            service.getUser.mockResolvedValue(user);

            await expect(controller.getUser(userId)).resolves.toEqual<GetUserResDto>(user);
            expect(service.getUser).toHaveBeenCalledWith<[number]>(userId);
        });
    });

    describe('createUser, 입력: 유저 생성 dto, 동작: dto전달 후 생성된 유저 정보 반환', () => {
        it('반환: 단일 유저 아이디 객체, 조건: 생성 성공', async () => {
            const createUserReqDto: CreateUserReqDto = {
                email: 'mock1@mock.com',
                name: '몰랑이',
                password: '1234',
            };
            const createUserResDto = plainToInstance(CreateUserResDto, mockUser1);
            service.createUser.mockResolvedValue(createUserResDto);

            await expect(controller.createUser(createUserReqDto)).resolves.toEqual<CreateUserResDto>(createUserResDto);
            expect(service.createUser).toHaveBeenCalledWith<[CreateUserReqDto]>(createUserReqDto);
        });
    });

    describe('updateUser, 입력: 유저 정보 수정 dto & 유저 아이디, 동작: dto 전달', () => {
        it('반환: undefined, 조건: 수정 성공', async () => {
            const userId = 1;
            const updateUserReqDto: UpdateUserReqDto = {
                name: '피우피우',
            };
            service.updateUser.mockResolvedValue(undefined);

            await expect(controller.updateUser(updateUserReqDto, userId)).resolves.toEqual<void>(undefined);
            expect(service.updateUser).toHaveBeenCalledWith<[{ updateUserReqDto: UpdateUserReqDto, userId: number }]>({ updateUserReqDto, userId });
        })
    });

    describe('deleteUser, 입력: 유저 아이디, 동작: 유저 아이디 전달', () => {
        it('반환: undefined, 조건: 삭제 성공', async () => {
            const userId = 1;
            service.deleteUser.mockResolvedValue(undefined);

            await expect(controller.deleteUser(userId)).resolves.toEqual<void>(undefined);
            expect(service.deleteUser).toHaveBeenCalledWith<[number]>(userId);
        });
    });
});