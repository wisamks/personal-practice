import { Test, TestingModule } from "@nestjs/testing";
import { CommentController } from "../comment.controller";
import { CommentService } from "../comment.service";
import { Comment } from "@prisma/client";
import { plainToInstance } from "class-transformer";
import { GetCommentResDto } from "../dto/response/get-comment.res.dto";
import { GetCommentsReqDto } from "../dto/request/get-comments.req.dto";
import { CreateCommentResDto } from "../dto/response/create-comment.res.dto";
import { CreateCommentReqDto } from "../dto/request/create-comment.req.dto";
import { UpdateCommentReqDto } from "../dto/request/update-comment.req.dto";

describe('CommentController', () => {
    const mockCommentService: jest.Mocked<Partial<CommentService>> = {
        getCommentsByPostId: jest.fn(),
        createComment: jest.fn(),
        updateComment: jest.fn(),
        deleteComment: jest.fn(),
    };

    let controller: CommentController;
    let service: jest.Mocked<CommentService>;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            controllers: [CommentController],
            providers: [
                {
                    provide: CommentService,
                    useValue: mockCommentService,
                }
            ],
        }).compile();

        controller = module.get<CommentController>(CommentController);
        service = module.get<jest.Mocked<CommentService>>(CommentService);
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

    describe('getCommentsByCursor, 입력: 게시글 아이디 & 댓글 쿼리, 동작: 전달 후 반환', () => {
        it('반환: 여러 댓글 객체 배열, 조건: 항상', async () => {
            const foundComments = plainToInstance(GetCommentResDto, [mockComment1, mockComment2]);
            const getCommentsReqDto: GetCommentsReqDto = {
                take: 10,
            };
            service.getCommentsByPostId.mockResolvedValue(foundComments);

            await expect(controller.getCommentsByCursor(getCommentsReqDto, postId)).resolves.toEqual<GetCommentResDto[]>(foundComments);
            expect(service.getCommentsByPostId).toHaveBeenCalledWith<[{ getCommentsReqDto: GetCommentsReqDto, postId: number }]>({ getCommentsReqDto, postId });
        });
    });

    describe('createComment, 입력: 댓글 생성 데이터 & 유저 아이디 & 게시글 아이디, 동작: 전달 후 반환', () => {
        it('반환: 댓글 아이디 객체, 조건: 항상', async () => {
            const createdComment: CreateCommentResDto = { commentId: mockComment1.id };
            const createCommentReqDto: CreateCommentReqDto = {
                content: mockComment1.content,
            };
            service.createComment.mockResolvedValue(createdComment);

            await expect(controller.createComment(createCommentReqDto, postId, userId)).resolves.toEqual<CreateCommentResDto>(createdComment);
            expect(service.createComment).toHaveBeenCalledWith<[{ createCommentReqDto: CreateCommentReqDto, userId: number, postId: number }]>({ createCommentReqDto, postId, userId });
        });
    });

    describe('updateComment, 입력: 댓글 수정 데이터 & 유저 아이디 & 게시글 아이디 & 댓글 아이디, 동작: 전달', () => {
        it('반환: undefined, 조건: 항상', async () => {
            const updateCommentReqDto: UpdateCommentReqDto = {
                content: '댓글 수정해본다.'
            };
            
            await expect(controller.updateComment(updateCommentReqDto, postId, commentId, userId)).resolves.toEqual<void>(undefined);
            expect(service.updateComment).toHaveBeenCalledWith<[{
                updateCommentReqDto: UpdateCommentReqDto,
                postId: number,
                commentId: number,
                userId: number,
            }]>({ updateCommentReqDto, postId, commentId, userId });
        });
    });

    describe('deleteComment, 입력: 댓글 아이디 & 게시글 아이디 & 유저 아이디, 동작: 전달 후 반환', () => {
        it('반환: 다음 댓글 객체, 조건: 항상', async () => {
            const nextComment = plainToInstance(GetCommentResDto, mockComment2);
            service.deleteComment.mockResolvedValue(nextComment);

            await expect(controller.deleteComment(commentId, postId, userId)).resolves.toEqual<GetCommentResDto>(nextComment);
            expect(service.deleteComment).toHaveBeenCalledWith<[{ commentId: number, postId: number, userId: number}]>({ commentId, postId, userId });
        });
    });
});