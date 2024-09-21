import { Test, TestingModule } from "@nestjs/testing";
import { PostTagRepository } from "../post-tag.repository";
import { PrismaService } from "@_/prisma/prisma.service";
import { PostTag, Prisma } from "@prisma/client";
import { RepositoryBadGatewayException } from "@_/common/custom-error.util";

describe('PostTagRepository', () => {
    const mockPrismaService = {
        postTag: {
            findMany: jest.fn(),
        },
    };

    const mockTx = {
        postTag: {
            createMany: jest.fn(),
            deleteMany: jest.fn(),
        },
    };

    let repository: PostTagRepository;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                PostTagRepository,
                {
                    provide: PrismaService,
                    useValue: mockPrismaService,
                },
            ],
        }).compile();

        repository = module.get<PostTagRepository>(PostTagRepository);
    });

    afterAll(() => {
        jest.clearAllMocks();
    });

    const mockRelation1: PostTag = {
        postId: 20,
        tagId: 1,
    };
    const mockRelation2: PostTag = {
        postId: 20,
        tagId: 2,
    };
    const postId = 20;

    describe('findRelationsByPostId, 입력: 게시글 아이디, 동작: 게시글의 전체 태그 아이디 관계 반환', () => {
        it('반환: 단일 게시글 - 전체 태그 관계 객체 배열, 조건: db 통신 성공', async () => {
            const foundRelations = [mockRelation1, mockRelation2];
            const where: Prisma.PostTagWhereInput = {
                postId,
            };
            mockPrismaService.postTag.findMany.mockResolvedValue(foundRelations);

            await expect(repository.findRelationsByPostId(postId)).resolves.toEqual<PostTag[]>(foundRelations);
            expect(mockPrismaService.postTag.findMany).toHaveBeenCalledWith<[Prisma.PostTagFindManyArgs]>({ where });
        });

        it('반환: BadGateWayError, 조건: db 통신 에러', async () => {
            const where: Prisma.PostTagWhereInput = {
                postId,
            };
            mockPrismaService.postTag.findMany.mockRejectedValue(new Error());

            await expect(repository.findRelationsByPostId(postId)).rejects.toThrow(RepositoryBadGatewayException);
            expect(mockPrismaService.postTag.findMany).toHaveBeenCalledWith<[Prisma.PostTagFindManyArgs]>({ where });
        });
    });

    describe('createRelations, 입력: 트랜잭션 객체 & 여러 게시글 - 태그 관계 객체 배열, 동작: 여러 관계 생성 후 결과 반환', () => {
        it('반환: 생성 결과 개수 객체, 조건: db 통신 성공', async () => {
            const createdResult: Prisma.BatchPayload = { count: 2 };
            const data: Prisma.PostTagCreateManyInput[] = [mockRelation1, mockRelation2];
            mockTx.postTag.createMany.mockResolvedValue(createdResult);

            await expect(repository.createRelations(mockTx as unknown as Prisma.TransactionClient, data)).resolves.toEqual<Prisma.BatchPayload>(createdResult);
            expect(mockTx.postTag.createMany).toHaveBeenCalledWith<[Prisma.PostTagCreateManyArgs]>({ data });
        });

        it('반환: BadGateWayError, 조건: db 통신 에러', async () => {
            const data: Prisma.PostTagCreateManyInput[] = [mockRelation1, mockRelation2];
            mockTx.postTag.createMany.mockRejectedValue(new Error());

            await expect(repository.createRelations(mockTx as unknown as Prisma.TransactionClient, data)).rejects.toThrow(RepositoryBadGatewayException);
            expect(mockTx.postTag.createMany).toHaveBeenCalledWith<[Prisma.PostTagCreateManyArgs]>({ data });
        });
    });

    describe('deleteRelationsByPostId, 입력: 트랜잭션 객체 & 게시글 아이디, 동작: 단일 게시글의 모든 태그 관계 삭제 후 결과 반환', () => {
        it('반환: 삭제 결과 개수 객체, 조건: db 통신 성공', async () => {
            const deletedResult: Prisma.BatchPayload = { count: 2 };
            const where: Prisma.PostTagWhereInput = {
                postId,
            };
            mockTx.postTag.deleteMany.mockResolvedValue(deletedResult);

            await expect(repository.deleteRelationsByPostId(mockTx as unknown as Prisma.TransactionClient, postId)).resolves.toEqual<Prisma.BatchPayload>(deletedResult);
            expect(mockTx.postTag.deleteMany).toHaveBeenCalledWith<[Prisma.PostTagDeleteManyArgs]>({ where });
        });

        it('반환: BadGateWayError, 조건: db 통신 에러', async () => {
            const where: Prisma.PostTagWhereInput = {
                postId,
            };
            mockTx.postTag.deleteMany.mockRejectedValue(new Error());

            await expect(repository.deleteRelationsByPostId(mockTx as unknown as Prisma.TransactionClient, postId)).rejects.toThrow(RepositoryBadGatewayException);
            expect(mockTx.postTag.deleteMany).toHaveBeenCalledWith<[Prisma.PostTagDeleteManyArgs]>({ where });
        });
    });
});