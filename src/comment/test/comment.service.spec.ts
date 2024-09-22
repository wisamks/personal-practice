import { Test, TestingModule } from "@nestjs/testing";
import { CommentService } from "../comment.service";
import { CommentRepository } from "../comment.repository";
import { Redis } from "ioredis";
import { ONE_HOUR_BY_SECOND } from "@_/redis/constants/redis.constant";
import { GetCommentsReqDto } from "../dto/request/get-comments.req.dto";
import { Comment, Prisma } from "@prisma/client";
import { IGetCommentsInput } from "../types/get-comments.input.interface";
import { GetCommentResDto } from "../dto/response/get-comment.res.dto";
import { plainToInstance } from "class-transformer";
import { CreateCommentReqDto } from "../dto/request/create-comment.req.dto";
import { CreateCommentResDto } from "../dto/response/create-comment.res.dto";
import { ICreateCommentInput } from "../types/create-comment.input.interface";
import { UpdateCommentReqDto } from "../dto/request/update-comment.req.dto";
import { CommentForbiddenException, CommentNotFoundException, RepositoryBadGatewayException } from "@_/common/custom-error.util";
import { IDeleteCommentInput } from "../types/delete-comment.input.interface";

describe('CommentService', () => {
    const mockCommentRepository: jest.Mocked<Partial<CommentRepository>> = {
        findCommentCountByPostId: jest.fn(),
        findCommentsByPostId: jest.fn(),
        createComment: jest.fn(),
        updateComment: jest.fn(),
        findComment: jest.fn(),
        deleteComment: jest.fn(),
    };

    const mockRedisClient: jest.Mocked<Partial<Redis>> = {
        get: jest.fn(),
        set: jest.fn(),
        incr: jest.fn(),
        del: jest.fn(),
        decr: jest.fn(),
    };

    let service: CommentService;
    let repository: jest.Mocked<CommentRepository>;
    let redisClient: jest.Mocked<Redis>;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                CommentService,
                {
                    provide: CommentRepository,
                    useValue: mockCommentRepository,
                },
                {
                    provide: 'REDIS-CLIENT', 
                    useValue: mockRedisClient,
                },
            ],
        }).compile();

        service = module.get<CommentService>(CommentService);
        repository = module.get<jest.Mocked<CommentRepository>>(CommentRepository);
        redisClient = module.get<jest.Mocked<Redis>>('REDIS-CLIENT');
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    const now = new Date();
    const postId = 20;
    const commentId = 1;
    const userId = 1;
    const commentsCountKey = `posts:${postId}:comments:count`;
    const commentsKey = `posts:${postId}:comments:default`;
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

    describe('getCommentCountByPostId, 입력: 게시글 아이디, 동작: 댓글 수 찾아서 반환', () => {
        it('반환: 댓글 수, 조건: 레디스에 없을 때, 동작: 찾아서 레디스에 저장 후 반환', async () => {
            const foundCount = 1;
            redisClient.get.mockResolvedValue(null);
            repository.findCommentCountByPostId.mockResolvedValue(foundCount);

            await expect(service.getCommentCountByPostId(postId)).resolves.toEqual<number>(foundCount);
            expect(redisClient.get).toHaveBeenCalledWith<[string]>(commentsCountKey);
            expect(repository.findCommentCountByPostId).toHaveBeenCalledWith<[number]>(postId);
            expect(redisClient.set).toHaveBeenCalledWith<[string, string, string, number]>(commentsCountKey, String(foundCount), 'EX', ONE_HOUR_BY_SECOND);
        });

        it('반환: 댓글 수, 조건: 레디스에 있을 때, 동작: 즉시 반환', async () => {
            const foundCount = 1;
            redisClient.get.mockResolvedValue(String(foundCount));

            await expect(service.getCommentCountByPostId(postId)).resolves.toEqual<number>(foundCount);
            expect(redisClient.get).toHaveBeenCalledWith<[string]>(commentsCountKey);
            expect(repository.findCommentCountByPostId).not.toHaveBeenCalled();
        });
    });

    describe('getCommentsFirstPage, 입력: 게시글 아이디 & 댓글 쿼리, 동작: 첫 페이지 댓글 반환', () => {
        it('반환: 여러 댓글 배열, 조건: 레디스에 없을 때, 동작: 레디스에 저장 후 반환', async () => {
            const foundComments = [mockComment1, mockComment2];
            const getCommentsReqDto: GetCommentsReqDto = {
                take: 10,
            };
            redisClient.get.mockResolvedValue(null);
            repository.findCommentsByPostId.mockResolvedValue(foundComments);

            await expect(service.getCommentsFirstPage({ getCommentsReqDto, postId })).resolves.toEqual<Comment[]>(foundComments);
            expect(redisClient.get).toHaveBeenCalledWith<[string]>(commentsKey);
            expect(repository.findCommentsByPostId).toHaveBeenCalledWith<[IGetCommentsInput]>({ ...getCommentsReqDto, postId });
            expect(redisClient.set).toHaveBeenCalledWith<[string, string, string, number]>(commentsKey, JSON.stringify(foundComments), 'EX', ONE_HOUR_BY_SECOND);
        });

        it('반환: 여러 댓글 배열, 조건: 레디스에 있을 때, 동작: 즉시 반환', async () => {
            const comments = [mockComment1, mockComment2];
            const foundComments = comments.map(comment => JSON.parse(JSON.stringify(comment)));
            const getCommentsReqDto: GetCommentsReqDto = {
                take: 10,
            };
            redisClient.get.mockResolvedValue(JSON.stringify(foundComments));

            await expect(service.getCommentsFirstPage({ getCommentsReqDto, postId })).resolves.toEqual<Comment[]>(foundComments);
            expect(redisClient.get).toHaveBeenCalledWith<[string]>(commentsKey);
            expect(repository.findCommentsByPostId).not.toHaveBeenCalled();
        });
    });

    describe('getCommentsByPostId, 입력: 게시글 아이디 & 댓글 쿼리, 동작: 여러 댓글 페이지별 반환', () => {
        it('반환: 여러 댓글 객체 배열, 조건: 항상', async () => {
            const foundComments = [mockComment1, mockComment2];
            const getCommentsReqDto: GetCommentsReqDto = {
                take: 10,
            };
            repository.findCommentsByPostId.mockResolvedValue(foundComments);

            await expect(service.getCommentsByPostId({ getCommentsReqDto, postId })).resolves.toEqual<GetCommentResDto[]>(plainToInstance(GetCommentResDto, foundComments));
            expect(repository.findCommentsByPostId).toHaveBeenCalledWith<[IGetCommentsInput]>({ ...getCommentsReqDto, postId });
        });
    });

    describe('createComment, 입력: 댓글 생성 데이터 & 게시글 아이디 & 유저 아이디', () => {
        it('반환: 생성 댓글 아이디 객체, 조건: 레디스에 댓글 수가 있을 때, 동작: 댓글 생성 및 댓글 수 증가 후 반환', async () => {
            const createdComment = mockComment1;
            const createCommentReqDto: CreateCommentReqDto = {
                content: mockComment1.content,
            };
            repository.createComment.mockResolvedValue(createdComment);
            redisClient.get.mockResolvedValue('2');

            await expect(service.createComment({ createCommentReqDto, postId, userId })).resolves.toEqual<CreateCommentResDto>(plainToInstance(CreateCommentResDto, createdComment));
            expect(repository.createComment).toHaveBeenCalledWith<[ICreateCommentInput]>({ ...createCommentReqDto, postId, authorId: userId });
            expect(redisClient.get).toHaveBeenCalledWith<[string]>(commentsCountKey);
            expect(redisClient.incr).toHaveBeenCalledWith<[string]>(commentsCountKey);
            expect(redisClient.del).toHaveBeenCalledWith<[string]>(commentsKey);
        });

        it('반환: 생성 댓글 아이디 객체, 조건: 레디스에 댓글 수가 없을 때, 동작: 댓글 생성 후 반환', async () => {
            const createdComment = mockComment1;
            const createCommentReqDto: CreateCommentReqDto = {
                content: mockComment1.content,
            };
            repository.createComment.mockResolvedValue(createdComment);
            redisClient.get.mockResolvedValue(null);

            await expect(service.createComment({ createCommentReqDto, postId, userId })).resolves.toEqual<CreateCommentResDto>(plainToInstance(CreateCommentResDto, createdComment));
            expect(repository.createComment).toHaveBeenCalledWith<[ICreateCommentInput]>({ ...createCommentReqDto, postId, authorId: userId });
            expect(redisClient.get).toHaveBeenCalledWith<[string]>(commentsCountKey);
            expect(redisClient.incr).not.toHaveBeenCalled();
            expect(redisClient.del).toHaveBeenCalledWith<[string]>(commentsKey);
        });
    });

    describe('updateComment, 입력: 댓글 수정 데이터 & 유저 아이디 & 게시글 아이디 & 댓글 아이디, 동작: 댓글 수정', () => {
        it('반환: undefined, 조건: 수정 성공', async () => {
            const updatedResult: Prisma.BatchPayload = { count: 1 };
            const updateCommentReqDto: UpdateCommentReqDto = {
                content: '댓글 수정한다.'
            };
            repository.updateComment.mockResolvedValue(updatedResult);

            await expect(service.updateComment({ updateCommentReqDto, userId, postId, commentId })).resolves.toEqual<void>(undefined);
            expect(redisClient.del).toHaveBeenCalledWith<[string]>(commentsKey);
            expect(repository.updateComment).toHaveBeenCalledWith<[{ data: Prisma.CommentUpdateInput, commentId: number, userId: number }]>({ data: updateCommentReqDto, commentId, userId });
            expect(repository.findComment).not.toHaveBeenCalled();
        });

        it('반환: NotFoundError, 조건: 댓글 없음', async () => {
            const updatedResult: Prisma.BatchPayload = { count: 0 };
            const updateCommentReqDto: UpdateCommentReqDto = {
                content: '댓글 수정한다.'
            };
            repository.updateComment.mockResolvedValue(updatedResult);
            repository.findComment.mockResolvedValue(null);

            await expect(service.updateComment({ updateCommentReqDto, userId, postId, commentId })).rejects.toThrow(CommentNotFoundException);
            expect(redisClient.del).toHaveBeenCalledWith<[string]>(commentsKey);
            expect(repository.updateComment).toHaveBeenCalledWith<[{ data: Prisma.CommentUpdateInput, commentId: number, userId: number }]>({ data: updateCommentReqDto, commentId, userId });
            expect(repository.findComment).toHaveBeenCalledWith<[number]>(commentId);
        });

        it('반환: ForbiddenError, 조건: 권한 없음', async () => {
            const updatedResult: Prisma.BatchPayload = { count: 0 };
            const updateCommentReqDto: UpdateCommentReqDto = {
                content: '댓글 수정한다.'
            };
            repository.updateComment.mockResolvedValue(updatedResult);
            repository.findComment.mockResolvedValue(mockComment2);

            await expect(service.updateComment({ updateCommentReqDto, userId: 2, postId, commentId })).rejects.toThrow(CommentForbiddenException);
            expect(redisClient.del).toHaveBeenCalledWith<[string]>(commentsKey);
            expect(repository.updateComment).toHaveBeenCalledWith<[{ data: Prisma.CommentUpdateInput, commentId: number, userId: number }]>({ data: updateCommentReqDto, commentId, userId: 2 });
            expect(repository.findComment).toHaveBeenCalledWith<[number]>(commentId);
        });
    });

    describe('deleteComment, 입력: 댓글 아이디 & 유저 아이디 & 게시글 아이디, 동작: 댓글 삭제 후 다음 댓글 반환', () => {
        it('반환: 다음 댓글 객체, 조건: 삭제 성공', async () => {
            const deletedResult: Prisma.BatchPayload = { count: 1 };
            const nextComment = mockComment2;
            repository.findCommentsByPostId.mockResolvedValue([nextComment]);
            repository.deleteComment.mockResolvedValue(deletedResult);

            await expect(service.deleteComment({ commentId, userId, postId })).resolves.toEqual<GetCommentResDto>(plainToInstance(GetCommentResDto, nextComment));
            expect(repository.findCommentsByPostId).toHaveBeenCalledWith<[IGetCommentsInput]>({ postId, cursor: commentId, take: 1 });
            expect(repository.deleteComment).toHaveBeenCalledWith<[IDeleteCommentInput]>({ commentId, userId });
            expect(redisClient.del).toHaveBeenCalledWith<[string]>(commentsKey);
            expect(redisClient.decr).toHaveBeenCalledWith<[string]>(commentsCountKey);
            expect(repository.findComment).not.toHaveBeenCalled();
        });

        it('반환: NotFoundError, 조건: 댓글 없음', async () => {
            const deletedResult: Prisma.BatchPayload = { count: 0 };
            const nextComment = mockComment2;
            repository.findCommentsByPostId.mockResolvedValue([nextComment]);
            repository.deleteComment.mockResolvedValue(deletedResult);
            repository.findComment.mockResolvedValue(null);

            await expect(service.deleteComment({ commentId, userId, postId })).rejects.toThrow(CommentNotFoundException);
            expect(repository.findCommentsByPostId).toHaveBeenCalledWith<[IGetCommentsInput]>({ postId, cursor: commentId, take: 1 });
            expect(repository.deleteComment).toHaveBeenCalledWith<[IDeleteCommentInput]>({ commentId, userId });
            expect(redisClient.del).not.toHaveBeenCalled();
            expect(redisClient.decr).not.toHaveBeenCalled();
            expect(repository.findComment).toHaveBeenCalledWith<[number]>(commentId);
        });

        it('반환: ForbiddenError, 조건: 권한 없음', async () => {
            const deletedResult: Prisma.BatchPayload = { count: 0 };
            const nextComment = mockComment2;
            repository.findCommentsByPostId.mockResolvedValue([nextComment]);
            repository.deleteComment.mockResolvedValue(deletedResult);
            repository.findComment.mockResolvedValue(mockComment1);

            await expect(service.deleteComment({ commentId, userId: 2, postId })).rejects.toThrow(CommentForbiddenException);
            expect(repository.findCommentsByPostId).toHaveBeenCalledWith<[IGetCommentsInput]>({ postId, cursor: commentId, take: 1 });
            expect(repository.deleteComment).toHaveBeenCalledWith<[IDeleteCommentInput]>({ commentId, userId: 2 });
            expect(redisClient.del).not.toHaveBeenCalled();
            expect(redisClient.decr).not.toHaveBeenCalled();
            expect(repository.findComment).toHaveBeenCalledWith<[number]>(commentId);
        });
    });
});