import { PrismaService } from "@_/prisma/prisma.service";
import { Test, TestingModule } from "@nestjs/testing";
import { UserRepository } from "../user.repository";
import { Prisma, User } from "@prisma/client";
import { RepositoryBadGatewayException } from "@_/common/custom-error.util";
import { IProviderOptions } from "../types/provider-options.interface";

describe('UserRepository', () => {
    const mockPrismaService = {
        user: {
            findMany: jest.fn(),
            findUnique: jest.fn(),
            findFirst: jest.fn(),
            create: jest.fn(),
            updateMany: jest.fn(),
        },
    };

    let repository: UserRepository;
    
    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                UserRepository,
                {
                    provide: PrismaService,
                    useValue: mockPrismaService,
                },
            ],
        }).compile();

        repository = module.get<UserRepository>(UserRepository);
    });

    afterEach(() => {
        jest.clearAllMocks();
        jest.useRealTimers();
    });

    const now = new Date();
    const mockUser1: User = {
        id: 1,
        createdAt: now,
        updatedAt: now,
        deletedAt: null,
        email: 'mock1@mock.com',
        name: '몰랑이',
        password: '1234',
        provider: null,
        providerId: null,
        refreshToken: 'as;dgklhefalsdkghk',
    };

    const mockUser2: User = {
        id: 2,
        createdAt: now,
        updatedAt: now,
        deletedAt: null,
        email: 'mock2@mock.com',
        name: '피우피우',
        password: 'google',
        provider: 'google',
        providerId: '1230956616',
        refreshToken: null,
    };

    describe('findUsers, 입력: 없음, 동작: db에서 전체 유저를 찾아서 반환', () => {
        it('반환: 전체 유저 객체 배열, 조건: db 통신 성공 시', async () => {
            const foundUsers = [mockUser1, mockUser2];
            const where: Prisma.UserWhereInput = {
                    deletedAt: null,
            };
            const orderBy: Prisma.UserOrderByWithAggregationInput = {
                createdAt: 'desc',
            };

            mockPrismaService.user.findMany.mockResolvedValue(foundUsers);

            await expect(repository.findUsers()).resolves.toEqual<User[]>(foundUsers);
            expect(mockPrismaService.user.findMany).toHaveBeenCalledWith<[Prisma.UserFindManyArgs]>({ where, orderBy });
        });

        it('반환: BadGateWayError, 조건: db 통신 에러 시', async () => {
            const where: Prisma.UserWhereInput = {
                    deletedAt: null,
            };
            const orderBy: Prisma.UserOrderByWithAggregationInput = {
                createdAt: 'desc',
            };

            mockPrismaService.user.findMany.mockRejectedValue(new Error());

            await expect(repository.findUsers()).rejects.toThrow(RepositoryBadGatewayException);
            expect(mockPrismaService.user.findMany).toHaveBeenCalledWith<[Prisma.UserFindManyArgs]>({ where, orderBy });
        });
    });

    describe('findUserById, 입력: 유저 아이디 숫자, 동작: 단일 유저를 db에서 찾아서 반환', () => {
        it('반환: 단일 유저 객체, 조건: db 통신 성공 시', async () => {
            const foundUser = mockUser1;
            const userId = mockUser1.id;
            const where: Prisma.UserWhereUniqueInput = {
                id: userId,
                deletedAt: null,
            };
            mockPrismaService.user.findUnique.mockResolvedValue(foundUser);

            await expect(repository.findUserById(userId)).resolves.toEqual<User>(foundUser);
            expect(mockPrismaService.user.findUnique).toHaveBeenCalledWith<[Prisma.UserFindUniqueArgs]>({ where });
        });

        it('반환: BadGateWayError, 조건: db 통신 에러 시', async () => {
            const userId = mockUser1.id;
            const where: Prisma.UserWhereUniqueInput = {
                id: userId,
                deletedAt: null,
            };
            mockPrismaService.user.findUnique.mockRejectedValue(new Error());

            await expect(repository.findUserById(userId)).rejects.toThrow(RepositoryBadGatewayException);
            expect(mockPrismaService.user.findUnique).toHaveBeenCalledWith<[Prisma.UserFindUniqueArgs]>({ where });
        });
    });

    describe('findUserByEmail, 입력: 이메일, 동작: 단일 유저를 찾아서 반환', () => {
        it('반환: 단일 유저 객체, 조건: db 통신 성공', async () => {
            const foundUser = mockUser1;
            const email = mockUser1.email;
            const where: Prisma.UserWhereInput = {
                email,
                deletedAt: null,
            };
            mockPrismaService.user.findFirst.mockResolvedValue(foundUser);

            await expect(repository.findUserByEmail(email)).resolves.toEqual<User>(foundUser);
            expect(mockPrismaService.user.findFirst).toHaveBeenCalledWith<[Prisma.UserFindFirstArgs]>({ where });
        });

        it('반환: BadGateWayError, 조건: db 통신 에러', async () => {
            const email = mockUser1.email;
            const where: Prisma.UserWhereInput = {
                email,
                deletedAt: null,
            };
            mockPrismaService.user.findFirst.mockRejectedValue(new Error());

            await expect(repository.findUserByEmail(email)).rejects.toThrow(RepositoryBadGatewayException);
            expect(mockPrismaService.user.findFirst).toHaveBeenCalledWith<[Prisma.UserFindFirstArgs]>({ where });
        });
    });

    describe('findUserByProviderOptions, 입력: provider options 객체, 동작: 단일 유저를 찾아서 반환', () => {
        it('반환: 단일 유저 객체, 조건: db 통신 성공', async () => {
            const foundUser = mockUser2;
            const providerOptions: IProviderOptions = {
                provider: mockUser2.provider,
                providerId: mockUser2.providerId,
            };
            const where: Prisma.UserWhereInput = {
                ...providerOptions,
                deletedAt: null,
            };
            mockPrismaService.user.findFirst.mockResolvedValue(foundUser);

            await expect(repository.findUserByProviderOptions(providerOptions)).resolves.toEqual<User>(foundUser);
            expect(mockPrismaService.user.findFirst).toHaveBeenCalledWith<[Prisma.UserFindFirstArgs]>({ where });
        });

        it('반환: BadGateWayError, 조건: db 통신 에러', async () => {
            const providerOptions: IProviderOptions = {
                provider: mockUser2.provider,
                providerId: mockUser2.providerId,
            };
            const where: Prisma.UserWhereInput = {
                ...providerOptions,
                deletedAt: null,
            };
            mockPrismaService.user.findFirst.mockRejectedValue(new Error());

            await expect(repository.findUserByProviderOptions(providerOptions)).rejects.toThrow(RepositoryBadGatewayException);
            expect(mockPrismaService.user.findFirst).toHaveBeenCalledWith<[Prisma.UserFindFirstArgs]>({ where });
        });
    });

    describe('createUser, 입력: 유저 생성 data, 동작: 유저 생성 후 반환', () => {
        it('반환: 단일 유저 객체, 조건: db 통신 성공', async () => {
            const createdUser = mockUser1;
            const data: Prisma.UserCreateInput = {
                email: mockUser1.email,
                password: mockUser1.password,
                name: mockUser1.name,
            };
            mockPrismaService.user.create.mockResolvedValue(createdUser);

            await expect(repository.createUser(data)).resolves.toEqual<User>(createdUser);
            expect(mockPrismaService.user.create).toHaveBeenCalledWith<[Prisma.UserCreateArgs]>({ data });
        });

        it('반환: BadGateWayError, 조건: db 통신 에러', async () => {
            const data: Prisma.UserCreateInput = {
                email: mockUser1.email,
                password: mockUser1.password,
                name: mockUser1.name,
            };
            mockPrismaService.user.create.mockRejectedValue(new Error());

            await expect(repository.createUser(data)).rejects.toThrow(RepositoryBadGatewayException);
            expect(mockPrismaService.user.create).toHaveBeenCalledWith<[Prisma.UserCreateArgs]>({ data });
        });
    });

    describe('updateUser, 입력: 유저 수정 data & 유저 아이디, 동작: 유저 수정 후 결과 반환', () => {
        it('반환: 수정 결과 개수 객체, 조건: db 통신 성공', async () => {
            const updatedResult: Prisma.BatchPayload = {
                count: 1,
            };
            const data: Prisma.UserUpdateInput = {
                name: '피우피우',
            };
            const userId = mockUser1.id;
            const where: Prisma.UserWhereInput = {
                id: userId,
                deletedAt: null,
            }
            mockPrismaService.user.updateMany.mockResolvedValue(updatedResult);

            await expect(repository.updateUser({ updateUserReqDto: data, userId })).resolves.toEqual<Prisma.BatchPayload>(updatedResult);
            expect(mockPrismaService.user.updateMany).toHaveBeenCalledWith<[Prisma.UserUpdateManyArgs]>({ data, where });
        });

        it('반환: BadGateWayError, 조건: db 통신 에러', async () => {
            const data: Prisma.UserUpdateInput = {
                name: '피우피우',
            };
            const userId = mockUser1.id;
            const where: Prisma.UserWhereInput = {
                id: userId,
                deletedAt: null,
            }
            mockPrismaService.user.updateMany.mockRejectedValue(new Error());

            await expect(repository.updateUser({ updateUserReqDto: data, userId })).rejects.toThrow(RepositoryBadGatewayException);
            expect(mockPrismaService.user.updateMany).toHaveBeenCalledWith<[Prisma.UserUpdateManyArgs]>({ data, where });
        });
    });

    describe('updateUserCreateRefresh, 입력: 리프레시 토큰 & 유저 아이디, 동작: 유저 테이블에 리프레시 토큰 저장 후 결과 반환', () => {
        it('반환: 수정 결과 개수 반환, 조건: db 통신 성공', async () => {
            const updatedResult: Prisma.BatchPayload = { count: 1 };
            const refreshToken = mockUser2.refreshToken;
            const userId = mockUser2.id;
            const where: Prisma.UserWhereInput = {
                id: userId,
                deletedAt: null,
            };
            const data: Prisma.UserUpdateInput = {
                refreshToken
            };
            mockPrismaService.user.updateMany.mockResolvedValue(updatedResult);

            await expect(repository.updateUserCreateRefresh({ refreshToken, userId })).resolves.toEqual<Prisma.BatchPayload>(updatedResult);
            expect(mockPrismaService.user.updateMany).toHaveBeenCalledWith<[Prisma.UserUpdateManyArgs]>({ where, data });
        });

        it('반환: BadGateWayError, 조건: db 통신 에러', async () => {
            const refreshToken = mockUser2.refreshToken;
            const userId = mockUser2.id;
            const where: Prisma.UserWhereInput = {
                id: userId,
                deletedAt: null,
            };
            const data: Prisma.UserUpdateInput = {
                refreshToken
            };
            mockPrismaService.user.updateMany.mockRejectedValue(new Error());

            await expect(repository.updateUserCreateRefresh({ refreshToken, userId })).rejects.toThrow(RepositoryBadGatewayException);
            expect(mockPrismaService.user.updateMany).toHaveBeenCalledWith<[Prisma.UserUpdateManyArgs]>({ where, data });
        });
    });

    describe('updateUserDeleteRefresh, 입력: 유저 아이디, 동작: 유저의 리프레시 토큰 db에서 삭제 후 결과 반환', () => {
        it('반환: 수정 결과 개수 객체, 조건: db 통신 성공', async () => {
            const updatedResult: Prisma.BatchPayload = { count: 1 };
            const userId = mockUser1.id;
            const where: Prisma.UserWhereInput = {
                id: userId,
                deletedAt: null,
            };
            const data: Prisma.UserUpdateInput = {
                refreshToken: null,
            };
            mockPrismaService.user.updateMany.mockResolvedValue(updatedResult);

            await expect(repository.updateUserDeleteRefresh(userId)).resolves.toEqual<Prisma.BatchPayload>(updatedResult);
            expect(mockPrismaService.user.updateMany).toHaveBeenCalledWith<[Prisma.UserUpdateManyArgs]>({ where, data });
        });

        it('반환: BadGateWayError, 조건: db 통신 에러', async () => {
            const userId = mockUser1.id;
            const where: Prisma.UserWhereInput = {
                id: userId,
                deletedAt: null,
            };
            const data: Prisma.UserUpdateInput = {
                refreshToken: null,
            };
            mockPrismaService.user.updateMany.mockRejectedValue(new Error());

            await expect(repository.updateUserDeleteRefresh(userId)).rejects.toThrow(RepositoryBadGatewayException);
            expect(mockPrismaService.user.updateMany).toHaveBeenCalledWith<[Prisma.UserUpdateManyArgs]>({ where, data });
        });
    });

    describe('deleteUser, 입력: 유저 아이디 & 현재 시각, 동작: 유저 소프트 딜리트 후 결과 반환', () => {
        it('반환: 삭제 결과 개수 객체, 조건: db 통신 성공', async () => {
            const deletedResult: Prisma.BatchPayload = { count: 1 };
            const userId = mockUser1.id;
            const where: Prisma.UserWhereInput = {
                id: userId,
                deletedAt: null,
            };
            const data: Prisma.UserUpdateInput = {
                deletedAt: now,
            };
            mockPrismaService.user.updateMany.mockResolvedValue(deletedResult);
            jest.useFakeTimers().setSystemTime(now);

            await expect(repository.deleteUser(userId)).resolves.toEqual<Prisma.BatchPayload>(deletedResult);
            expect(mockPrismaService.user.updateMany).toHaveBeenCalledWith<[Prisma.UserUpdateManyArgs]>({ where, data });
        });

        it('반환: BadGateWayError, 조건: db 통신 에러', async () => {
            const userId = mockUser1.id;
            const where: Prisma.UserWhereInput = {
                id: userId,
                deletedAt: null,
            };
            const data: Prisma.UserUpdateInput = {
                deletedAt: now,
            };
            jest.useFakeTimers().setSystemTime(now);
            mockPrismaService.user.updateMany.mockRejectedValue(new Error());

            await expect(repository.deleteUser(userId)).rejects.toThrow(RepositoryBadGatewayException);
            expect(mockPrismaService.user.updateMany).toHaveBeenCalledWith<[Prisma.UserUpdateManyArgs]>({ where, data });
        });
    });
});