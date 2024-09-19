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

    describe('getUsers', () => {
        it('return users', async () => {
            const users = plainToInstance(GetUserResDto, [mockUser1, mockUser2]);
            service.getUsers.mockResolvedValue(users);

            await expect(controller.getUsers()).resolves.toEqual(users);
            expect(service.getUsers).toHaveBeenCalled();
        });
    });

    describe('getUser', () => {
        it('return user if found', async () => {
            const userId = 1;
            const user = plainToInstance(GetUserResDto, mockUser1);
            service.getUser.mockResolvedValue(user);

            await expect(controller.getUser(userId)).resolves.toEqual(user);
            expect(service.getUser).toHaveBeenCalledWith(userId);
        });
    });

    describe('createUser', () => {
        it('return userId dto if created', async () => {
            const createUserReqDto: CreateUserReqDto = {
                email: 'mock1@mock.com',
                name: '몰랑이',
                password: '1234',
            };
            const createUserResDto = plainToInstance(CreateUserResDto, mockUser1);
            service.createUser.mockResolvedValue(createUserResDto);

            await expect(controller.createUser(createUserReqDto)).resolves.toEqual(createUserResDto);
            expect(service.createUser).toHaveBeenCalledWith(createUserReqDto);
        });
    });

    describe('updateUser', () => {
        it('return void', async () => {
            const userId = 1;
            const updateUserReqDto: UpdateUserReqDto = {
                name: '피우피우',
            };
            service.updateUser.mockResolvedValue(undefined);

            await expect(controller.updateUser(updateUserReqDto, userId)).resolves.toEqual(undefined);
            expect(service.updateUser).toHaveBeenCalledWith({ updateUserReqDto, userId });
        })
    });

    describe('deleteUser', () => {
        it('return void', async () => {
            const userId = 1;
            service.deleteUser.mockResolvedValue(undefined);

            await expect(controller.deleteUser(userId)).resolves.toEqual(undefined);
            expect(service.deleteUser).toHaveBeenCalledWith(userId);
        });
    });
});