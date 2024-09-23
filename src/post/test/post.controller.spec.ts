import { Test, TestingModule } from "@nestjs/testing";
import { PostController } from "../post.controller";
import { PostService } from "../post.service";
import { generateDatetime } from "@_/common/generate-datetime.util";
import { Comment, Post, User } from "@prisma/client";
import { GetCursorReqDto } from "../dto/request/get-cursor.req.dto";
import { plainToInstance } from "class-transformer";
import { GetPostResDto } from "../dto/response/get-post.res.dto";
import { GetPostsReqDto } from "../dto/request/get-posts.req.dto";
import { CreatePostResDto } from "../dto/response/create-post.res.dto";
import { CreatePostReqDto } from "../dto/request/create-post.req.dto";
import { UpdatePostReqDto } from "../dto/request/update-post.req.dto";
import { IDeletePostQuery } from "../types/delete-post.query.interface";

describe('PostController', () => {
    const mockPostService: jest.Mocked<Partial<PostService>> = {
        getPostsByCursor: jest.fn(),
        getPosts: jest.fn(),
        getPost: jest.fn(),
        createPost: jest.fn(),
        updatePost: jest.fn(),
        deletePost: jest.fn(),
    };

    let controller: PostController;
    let service: jest.Mocked<PostService>;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            controllers: [PostController],
            providers: [
                {
                    provide: PostService,
                    useValue: mockPostService,
                },
            ],
        }).compile();

        controller = module.get<PostController>(PostController);
        service = module.get<jest.Mocked<PostService>>(PostService);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    const now = generateDatetime();
    const postId = 1;
    const userId = 1;
    const mockPost1: Post = {
        id: 1,
        authorId: 1,
        title: '제목',
        content: '본문',
        createdAt: now,
        updatedAt: now,
        deletedAt: null,
    };
    const mockPost2: Post = {
        id: 2,
        authorId: 2,
        title: '제목',
        content: '본문',
        createdAt: now,
        updatedAt: now,
        deletedAt: null,
    };
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
        refreshToken: null,
    };
    const mockComment1: Comment = {
        id: 1,
        createdAt: now,
        updatedAt: now,
        deletedAt: null,
        authorId: 1,
        postId: 1,
        content: '댓글 내용',
    };

    describe('getPostsByCursor, 입력: 페이지네이션 쿼리, 동작: 데이터 전달 후 여러 게시글 반환', () => {
        it('반환: 여러 게시글 객체 배열, 조건: 항상', async () => {
            const foundPosts = [mockPost1, mockPost2];
            const getCursorReqDto: GetCursorReqDto = {
                take: 10,
            };
            const result = plainToInstance(GetPostResDto, foundPosts);
            service.getPostsByCursor.mockResolvedValue(result);

            await expect(controller.getPostsByCursor(getCursorReqDto)).resolves.toEqual<GetPostResDto[]>(result);
            expect(service.getPostsByCursor).toHaveBeenCalledWith<[GetCursorReqDto]>(getCursorReqDto);
        });
    });

    describe('getPosts, 입력: 페이지네이션 쿼리, 동작: 데이터 전달 후 여러 게시글 반환', () => {
        it('반환: 여러 게시글 객체 배열, 조건: 항상', async () => {
            const foundPosts = [mockPost1, mockPost2];
            const getPostsReqDto: GetPostsReqDto = {
                skip: 1,
                take: 10,
            };
            const result = plainToInstance(GetPostResDto, foundPosts);
            service.getPosts.mockResolvedValue(result);

            await expect(service.getPosts(getPostsReqDto)).resolves.toEqual<GetPostResDto[]>(result);
            expect(service.getPosts).toHaveBeenCalledWith(getPostsReqDto);
        });
    });

    describe('getPost, 입력: 게시글 아이디 & 유저 아이디, 동작: 데이터 전달 후 단일 게시글 반환', () => {
        it('반환: 단일 게시글 객체, 조건: 항상', async () => {
            const foundPost = plainToInstance(GetPostResDto, mockPost1);
            service.getPost.mockResolvedValue(foundPost);

            await expect(controller.getPost(postId, userId)).resolves.toEqual<GetPostResDto>(foundPost);
            expect(service.getPost).toHaveBeenCalledWith<[{ postId: number, userId: number }]>({ postId, userId });
        });
    });

    describe('createPost, 입력: 게시글 생성 데이터 & 유저 아이디, 동작: 데이터 전달 후 단일 게시글 반환', () => {
        it('반환: 단일 게시글 생성 객체, 조건: 항상', async () => {
            const createdPost = plainToInstance(CreatePostResDto, mockPost1);
            const createPostReqDto: CreatePostReqDto = {
                title: '제목',
                content: '내용',
            };
            service.createPost.mockResolvedValue(createdPost);

            await expect(controller.createPost(createPostReqDto, userId)).resolves.toEqual<CreatePostResDto>(createdPost);
            expect(service.createPost).toHaveBeenCalledWith<[{
                createPostReqDto: CreatePostReqDto,
                userId: number,
            }]>({ createPostReqDto, userId });
        });
    });

    describe('updatePost, 입력: 게시글 수정 데이터 & 유저 아이디 & 게시글 아이디, 동작: 데이터 전달', () => {
        it('반환: undefined, 조건: 항상', async () => {
            const updatePostReqDto: UpdatePostReqDto = {
                title: '졔묙',
                content: '뵨뮨',
            };

            await expect(controller.updatePost(updatePostReqDto, postId, userId)).resolves.toEqual<void>(undefined);
            expect(service.updatePost).toHaveBeenCalledWith<[{
                updatePostReqDto: UpdatePostReqDto,
                postId: number,
                userId: number,
            }]>({ updatePostReqDto, postId, userId });
        });
    });

    describe('deletePost, 입력: 유저 아이디 & 게시글 아이디, 동작: 데이터 전달', () => {
        it('반환: undefined, 조건: 항상', async () => {
            await expect(controller.deletePost(postId, userId)).resolves.toEqual<void>(undefined);
            expect(service.deletePost).toHaveBeenCalledWith<[IDeletePostQuery]>({ userId, postId });
        });
    });
});