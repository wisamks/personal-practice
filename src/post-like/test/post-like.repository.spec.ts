import { Test, TestingModule } from "@nestjs/testing";
import { PostLikeRepository } from "../post-like.repository";
import { PrismaService } from "@_/prisma/prisma.service";
import { PostLike, Prisma } from "@prisma/client";
import { RepositoryBadGatewayException } from "@_/common/custom-error.util";
import { ITogglePostLikeReq } from "../types/toggle-post-like.req.interface";

describe('PostLikeRepository', () => {
    const mockPrismaService = {
        postLike: {
            findMany: jest.fn(),
            count: jest.fn(),
            findFirst: jest.fn(),
            create: jest.fn(),
            createMany: jest.fn(),
            update: jest.fn(),
            updateMany: jest.fn(),
        },
    };
    
    let repository: PostLikeRepository;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                PostLikeRepository,
                {
                    provide: PrismaService,
                    useValue: mockPrismaService,
                },
            ],
        }).compile();

        repository = module.get<PostLikeRepository>(PostLikeRepository);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    const now = new Date();
    const mockPostLike1: PostLike = {
        id: 1,
        createdAt: now,
        updatedAt: now,
        deletedAt: null,
        postId: 20,
        userId: 1,
    };
    const mockPostLike2: PostLike = {
        id: 2,
        createdAt: now,
        updatedAt: now,
        deletedAt: null,
        postId: 20,
        userId: 2,
    };
    const postId = 20;
    const userId = 1;

    describe('findPostLikesByPostId, 입력: 게시글 아이디, 동작: 단일 게시글의 전체 좋아요 반환', () => {
        it('반환: 좋아요 객체 배열, 조건: db 통신 성공', async () => {
            const foundPostLikes = [mockPostLike1, mockPostLike2];
            const where: Prisma.PostLikeWhereInput = {
                postId,
                deletedAt: null,
            };
            mockPrismaService.postLike.findMany.mockResolvedValue(foundPostLikes);

            await expect(repository.findPostLikesByPostId(postId)).resolves.toEqual<PostLike[]>(foundPostLikes);
            expect(mockPrismaService.postLike.findMany).toHaveBeenCalledWith<[Prisma.PostLikeFindManyArgs]>({ where });
        });

        it('반환: BadGateWayError, 조건: db 통신 에러', async () => {
            const where: Prisma.PostLikeWhereInput = {
                postId,
                deletedAt: null,
            };
            mockPrismaService.postLike.findMany.mockRejectedValue(new Error());

            await expect(repository.findPostLikesByPostId(postId)).rejects.toThrow(RepositoryBadGatewayException);
            expect(mockPrismaService.postLike.findMany).toHaveBeenCalledWith<[Prisma.PostLikeFindManyArgs]>({ where });
        });
    });

    describe('findPostLikeCountByPostId, 입력: 게시글 아이디, 동작: 단일 게시글 조회 수 반환', () => {
        it('반환: 단일 게시글 조회 수, 조건: db 통신 성공', async () => {
            const foundCount = 2;
            const where: Prisma.PostLikeWhereInput = {
                postId,
                deletedAt: null,
            };
            mockPrismaService.postLike.count.mockResolvedValue(foundCount);

            await expect(repository.findPostLikeCountByPostId(postId)).resolves.toEqual<number>(foundCount);
            expect(mockPrismaService.postLike.count).toHaveBeenCalledWith<[Prisma.PostLikeCountArgs]>({ where });
        });

        it('반환: BadGateWayError, 조건: db 통신 에러', async () => {
            const where: Prisma.PostLikeWhereInput = {
                postId,
                deletedAt: null,
            };
            mockPrismaService.postLike.count.mockRejectedValue(new Error());

            await expect(repository.findPostLikeCountByPostId(postId)).rejects.toThrow(RepositoryBadGatewayException);
            expect(mockPrismaService.postLike.count).toHaveBeenCalledWith<[Prisma.PostLikeCountArgs]>({ where });
        });
    });

    describe('findPostLikeByPostAndUser, 입력: 게시글 아이디 & 유저 아이디, 동작: 단일 좋아요 반환', () => {
        it('반환: 단일 좋아요 객체, 조건: db 통신 성공', async () => {
            const foundLike = mockPostLike1;
            const query: ITogglePostLikeReq = {
                postId,
                userId,
            };
            const where: Prisma.PostLikeWhereInput = {
                ...query,
                deletedAt: null,
            };
            mockPrismaService.postLike.findFirst.mockResolvedValue(foundLike);

            await expect(repository.findPostLikeByPostAndUser(query)).resolves.toEqual<PostLike>(foundLike);
            expect(mockPrismaService.postLike.findFirst).toHaveBeenCalledWith<[Prisma.PostLikeFindFirstArgs]>({ where });
        });

        it('반환: BadGateWayError, 조건: db 통신 에러', async () => {
            const query: ITogglePostLikeReq = {
                postId,
                userId,
            };
            const where: Prisma.PostLikeWhereInput = {
                ...query,
                deletedAt: null,
            };
            mockPrismaService.postLike.findFirst.mockRejectedValue(new Error());

            await expect(repository.findPostLikeByPostAndUser(query)).rejects.toThrow(RepositoryBadGatewayException);
            expect(mockPrismaService.postLike.findFirst).toHaveBeenCalledWith<[Prisma.PostLikeFindFirstArgs]>({ where });
        });
    });

    describe('createPostLike, 입력: 게시글 아이디 & 유저 아이디, 동작: 단일 좋아요 생성 후 반환', () => {
        it('반환: 단일 좋아요 객체, 조건: db 통신 성공', async () => {
            const createdPostLike: PostLike = mockPostLike1;
            const data: ITogglePostLikeReq = {
                postId,
                userId,
            };
            mockPrismaService.postLike.create.mockResolvedValue(createdPostLike);

            await expect(repository.createPostLike(data)).resolves.toEqual<PostLike>(createdPostLike);
            expect(mockPrismaService.postLike.create).toHaveBeenCalledWith<[Prisma.PostLikeCreateArgs]>({ data });
        });

        it('반환: BadGateWayError, 조건: db 통신 에러', async () => {
            const data: ITogglePostLikeReq = {
                postId,
                userId,
            };
            mockPrismaService.postLike.create.mockRejectedValue(new Error());

            await expect(repository.createPostLike(data)).rejects.toThrow(RepositoryBadGatewayException);
            expect(mockPrismaService.postLike.create).toHaveBeenCalledWith<[Prisma.PostLikeCreateArgs]>({ data });
        });
    });

    describe('createPostLikes, 입력: 게시글 아이디 & 유저 아이디 배열, 동작: 여러 좋아요 생성 후 결과 반환', () => {
        it('반환: 생성 결과 개수 객체, 조건: db 통신 성공', async () => {
            const createdResult = { count: 2 };
            const data: ITogglePostLikeReq[] = [{ postId, userId }, { postId, userId: 2 }];
            mockPrismaService.postLike.createMany.mockResolvedValue(createdResult);

            await expect(repository.createPostLikes(data)).resolves.toEqual<Prisma.BatchPayload>(createdResult);
            expect(mockPrismaService.postLike.createMany).toHaveBeenCalledWith<[Prisma.PostLikeCreateManyArgs]>({ data });
        });

        it('반환: BadGateWayError, 조건: db 통신 에러', async () => {
            const data: ITogglePostLikeReq[] = [{ postId, userId }, { postId, userId: 2 }];
            mockPrismaService.postLike.createMany.mockRejectedValue(new Error());

            await expect(repository.createPostLikes(data)).rejects.toThrow(RepositoryBadGatewayException);
            expect(mockPrismaService.postLike.createMany).toHaveBeenCalledWith<[Prisma.PostLikeCreateManyArgs]>({ data });
        });
    });

    describe('deletePostLike, 입력: 좋아요 아이디, 동작: 단일 좋아요 삭제', () => {
        it('반환: undefined, 조건: db 통신 성공', async () => {
            const deletedLike: PostLike = {
                ...mockPostLike1,
                deletedAt: now,
            };
            const id = 1;
            const where: Prisma.PostLikeWhereUniqueInput = {
                id,
                deletedAt: null,
            };
            const data: Prisma.PostLikeUpdateInput = {
                deletedAt: now,
            };
            mockPrismaService.postLike.update.mockResolvedValue(deletedLike);

            await expect(repository.deletePostLike(id)).resolves.toEqual<void>(undefined);
            expect(mockPrismaService.postLike.update).toHaveBeenCalled();
        });

        it('반환: BadGateWayError, 조건: db 통신 에러', async () => {
            const id = 1;
            const where: Prisma.PostLikeWhereUniqueInput = {
                id,
                deletedAt: null,
            };
            const data: Prisma.PostLikeUpdateInput = {
                deletedAt: null,
            };
            mockPrismaService.postLike.update.mockRejectedValue(new Error());

            await expect(repository.deletePostLike(id)).rejects.toThrow(RepositoryBadGatewayException);
            expect(mockPrismaService.postLike.update).toHaveBeenCalled();
        });
    });

    describe('deletePostLikes, 입력: 게시글 아이디 & 유저 아이디 배열, 동작: 여러 좋아요 삭제 후 결과 반환', () => {
        it('반환: 삭제 결과 개수 객체, 조건: db 통신 성공', async () => {
            const deletedResult: Prisma.BatchPayload = { count: 1 };
            const userIds = [userId];
            const where: Prisma.PostLikeWhereInput = {
                postId,
                userId: {
                    in: userIds,
                },
                deletedAt: null,
            };
            const data: Prisma.PostLikeUpdateInput = {
                deletedAt: now,
            };
            mockPrismaService.postLike.updateMany.mockResolvedValue(deletedResult);

            await expect(repository.deletePostLikes({ postId, userIds })).resolves.toEqual<Prisma.BatchPayload>(deletedResult);
            expect(mockPrismaService.postLike.updateMany).toHaveBeenCalled();
        });

        it('반환: BadGateWayError, 조건: db 통신 에러', async () => {
            const userIds = [userId];
            const where: Prisma.PostLikeWhereInput = {
                postId,
                userId: {
                    in: userIds,
                },
                deletedAt: null,
            };
            const data: Prisma.PostLikeUpdateInput = {
                deletedAt: now,
            };
            mockPrismaService.postLike.updateMany.mockRejectedValue(new Error());

            await expect(repository.deletePostLikes({ postId, userIds })).rejects.toThrow(RepositoryBadGatewayException);
            expect(mockPrismaService.postLike.updateMany).toHaveBeenCalled();
        });
    });
});