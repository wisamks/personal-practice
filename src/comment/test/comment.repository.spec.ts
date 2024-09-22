import { Test, TestingModule } from "@nestjs/testing";
import { CommentRepository } from "../comment.repository";
import { PrismaService } from "@_/prisma/prisma.service";
import { Comment, Prisma } from "@prisma/client";
import { RepositoryBadGatewayException } from "@_/common/custom-error.util";
import { ICreateCommentInput } from "../types/create-comment.input.interface";

describe('CommentRepository', () => {
    const mockPrismaService = {
        comment: {
            count: jest.fn(),
            findMany: jest.fn(),
            findUnique: jest.fn(),
            create: jest.fn(),
            updateMany: jest.fn(),

        },
    };

    let repository: CommentRepository;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                CommentRepository,
                {
                    provide: PrismaService,
                    useValue: mockPrismaService,
                },
            ],
        }).compile();

        repository = module.get<CommentRepository>(CommentRepository);
    });

    afterEach(() => {
        jest.clearAllMocks();
        jest.useRealTimers();
    });

    const postId = 20;
    const userId = 1;
    const commentId = 1;
    const now = new Date();
    const mockComment1: Comment = {
        id: 1,
        createdAt: now,
        updatedAt: now,
        deletedAt: null,
        authorId: 1,
        postId: 20,
        content: '댓글이란 참 쓰기 어려운 것이구나.'
    };
    const mockComment2: Comment = {
        id: 2,
        createdAt: now,
        updatedAt: now,
        deletedAt: null,
        authorId: 1,
        postId: 20,
        content: '댓글이란 의외로 쓰기 쉬운 것이구나.'
    };

    describe('findCommentCountByPostId, 입력: 게시글 아이디, 동작: 단일 게시글 댓글 수 찾아서 반환', () => {
        it('반환: 단일 게시글 댓글 수, 조건: db 통신 성공', async () => {
            const foundCount = 20;
            const where: Prisma.CommentWhereInput = {
                postId,
                deletedAt: null,
            };
            mockPrismaService.comment.count.mockResolvedValue(foundCount);

            await expect(repository.findCommentCountByPostId(postId)).resolves.toEqual<number>(foundCount);
            expect(mockPrismaService.comment.count).toHaveBeenCalledWith<[Prisma.CommentCountArgs]>({ where });
        });

        it('반환: BadGateWayError, 조건: db 통신 에러', async () => {
            const where: Prisma.CommentWhereInput = {
                postId,
                deletedAt: null,
            };
            mockPrismaService.comment.count.mockRejectedValue(new Error());

            await expect(repository.findCommentCountByPostId(postId)).rejects.toThrow(RepositoryBadGatewayException);
            expect(mockPrismaService.comment.count).toHaveBeenCalledWith<[Prisma.CommentCountArgs]>({ where });
        });
    });

    describe('findCommentsByPostId, 입력: 댓글 쿼리, 동작: 댓글 페이지네이션 및 반환', () => {
        it('반환: 여러 댓글 객체 배열, 조건: db 통신 성공', async () => {
            const foundComments = [mockComment1, mockComment2];
            const take = 10;
            const cursor = undefined;
            const where: Prisma.CommentWhereInput = {
                postId,
                deletedAt: null,
            };
            const orderBy: Prisma.CommentOrderByWithRelationInput = {
                id: 'desc',
            };
            const include: Prisma.CommentInclude = {
                author: true,
            };
            const skip = cursor ? 1 : 0;
            const optionalCursor = cursor && { cursor: { id: cursor }};
            mockPrismaService.comment.findMany.mockResolvedValue(foundComments);

            await expect(repository.findCommentsByPostId({ postId, take, cursor })).resolves.toEqual<Comment[]>(foundComments);
            expect(mockPrismaService.comment.findMany).toHaveBeenCalledWith({ where, orderBy, include, skip, take, ...optionalCursor });
        });

        it('반환: BadGateWayError, 조건: db 통신 에러', async () => {
            const take = 10;
            const cursor = undefined;
            const where: Prisma.CommentWhereInput = {
                postId,
                deletedAt: null,
            };
            const orderBy: Prisma.CommentOrderByWithRelationInput = {
                id: 'desc',
            };
            const include: Prisma.CommentInclude = {
                author: true,
            };
            const skip = cursor ? 1 : 0;
            const optionalCursor = cursor && { cursor: { id: cursor }};
            mockPrismaService.comment.findMany.mockRejectedValue(new Error());

            await expect(repository.findCommentsByPostId({ postId, take, cursor })).rejects.toThrow(RepositoryBadGatewayException);
            expect(mockPrismaService.comment.findMany).toHaveBeenCalledWith({ where, orderBy, include, skip, take, ...optionalCursor });
        });
    });

    describe('findComment, 입력: 댓글 아이디, 동작: 단일 댓글 반환', () => {
        it('반환: 단일 댓글 객체, 조건: db 통신 성공', async () => {
            const foundComment = mockComment1;
            const where: Prisma.CommentWhereUniqueInput = {
                id: commentId,
                deletedAt: null,
            };
            mockPrismaService.comment.findUnique.mockResolvedValue(foundComment);
            
            await expect(repository.findComment(commentId)).resolves.toEqual<Comment>(foundComment);
            expect(mockPrismaService.comment.findUnique).toHaveBeenCalledWith<[Prisma.CommentFindUniqueArgs]>({ where });
        });

        it('반환: BadGateWayError, 조건: db 통신 에러', async () => {
            const where: Prisma.CommentWhereUniqueInput = {
                id: commentId,
                deletedAt: null,
            };
            mockPrismaService.comment.findUnique.mockRejectedValue(new Error());
            
            await expect(repository.findComment(commentId)).rejects.toThrow(RepositoryBadGatewayException);
            expect(mockPrismaService.comment.findUnique).toHaveBeenCalledWith<[Prisma.CommentFindUniqueArgs]>({ where });
        });
    });

    describe('createComment, 입력: 댓글 생성 데이터, 동작: 단일 댓글 생성 후 반환', () => {
        it('반환: 생성된 단일 댓글 객체, 조건: db 통신 성공', async () => {
            const createdComment = mockComment1;
            const data: ICreateCommentInput = {
                authorId: userId,
                content: mockComment1.content,
                postId: postId,
            };
            mockPrismaService.comment.create.mockResolvedValue(createdComment);

            await expect(repository.createComment(data)).resolves.toEqual<Comment>(createdComment);
            expect(mockPrismaService.comment.create).toHaveBeenCalledWith<[Prisma.CommentCreateArgs]>({ data });
        });

        it('반환: BadGateWayError, 조건: db 통신 에러', async () => {
            const data: ICreateCommentInput = {
                authorId: userId,
                content: mockComment1.content,
                postId: postId,
            };
            mockPrismaService.comment.create.mockRejectedValue(new Error());

            await expect(repository.createComment(data)).rejects.toThrow(RepositoryBadGatewayException);
            expect(mockPrismaService.comment.create).toHaveBeenCalledWith<[Prisma.CommentCreateArgs]>({ data });
        });
    });

    describe('updateComment, 입력: 댓글 수정 데이터 & 댓글 아이디, 동작: 단일 댓글 수정 후 결과 반환', () => {
        it('반환: 수정 결과 개수 객체, 조건: db 통신 성공', async () => {
            const updatedResult: Prisma.BatchPayload = { count: 1 };
            const data: Prisma.CommentUpdateInput = {
                content: '댓글을 수정하는 내용',
            };
            const where: Prisma.CommentWhereInput = {
                id: commentId,
                authorId: userId,
                deletedAt: null,
            };
            mockPrismaService.comment.updateMany.mockResolvedValue(updatedResult);

            await expect(repository.updateComment({ data, commentId, userId })).resolves.toEqual<Prisma.BatchPayload>(updatedResult);
            expect(mockPrismaService.comment.updateMany).toHaveBeenCalledWith<[Prisma.CommentUpdateManyArgs]>({ data, where });
        });

        it('반환: BadGateWayError, 조건: db 통신 에러', async () => {
            const data: Prisma.CommentUpdateInput = {
                content: '댓글을 수정하는 내용',
            };
            const where: Prisma.CommentWhereInput = {
                id: commentId,
                authorId: userId,
                deletedAt: null,
            };
            mockPrismaService.comment.updateMany.mockRejectedValue(new Error());

            await expect(repository.updateComment({ data, commentId, userId })).rejects.toThrow(RepositoryBadGatewayException);
            expect(mockPrismaService.comment.updateMany).toHaveBeenCalledWith<[Prisma.CommentUpdateManyArgs]>({ data, where });
        });
    });

    describe('deleteComment, 입력: 댓글 아이디, 동작: 단일 댓글 삭제 후 결과 반환', () => {
        it('반환: 삭제 결과 개수 객체, 조건: db 통신 성공', async () => {
            const deletedResult: Prisma.BatchPayload = { count: 1 };
            const where: Prisma.CommentWhereInput = {
                id: commentId,
                authorId: userId,
                deletedAt: null,
            };
            const data: Prisma.CommentUpdateInput = {
                deletedAt: now,
            };
            mockPrismaService.comment.updateMany.mockResolvedValue(deletedResult);
            jest.useFakeTimers().setSystemTime(now);

            await expect(repository.deleteComment({ commentId, userId })).resolves.toEqual<Prisma.BatchPayload>(deletedResult);
            expect(mockPrismaService.comment.updateMany).toHaveBeenCalledWith<[Prisma.CommentUpdateManyArgs]>({ where, data });
        });

        it('반환: BadGateWayError, 조건: db 통신 에러', async () => {
            const where: Prisma.CommentWhereInput = {
                id: commentId,
                authorId: userId,
                deletedAt: null,
            };
            const data: Prisma.CommentUpdateInput = {
                deletedAt: now,
            };
            mockPrismaService.comment.updateMany.mockRejectedValue(new Error());
            jest.useFakeTimers().setSystemTime(now);

            await expect(repository.deleteComment({ commentId, userId })).rejects.toThrow(RepositoryBadGatewayException);
            expect(mockPrismaService.comment.updateMany).toHaveBeenCalledWith<[Prisma.CommentUpdateManyArgs]>({ where, data });
        });
    });
});