import { Test, TestingModule } from "@nestjs/testing";
import { PostService } from "../post.service";
import { PostRepository } from "../post.repository";
import { TagService } from "@_/tag/tag.service";
import { PrismaService } from "@_/prisma/prisma.service";
import { CommentService } from "@_/comment/comment.service";
import { ViewService } from "@_/view/view.service";
import { PostLikeService } from "@_/post-like/post-like.service";
import { Comment, Post, Prisma, User } from "@prisma/client";
import { Redis } from "ioredis";
import { generateDatetime } from "@_/common/generate-datetime.util";
import { plainToInstance } from "class-transformer";
import { GetCursorReqDto } from "../dto/request/get-cursor.req.dto";
import { GetPostResDto } from "../dto/response/get-post.res.dto";
import { GetPostsReqDto } from "../dto/request/get-posts.req.dto";
import { ONE_HOUR_BY_SECOND } from "@_/redis/constants/redis.constant";
import { GetCommentsReqDto } from "@_/comment/dto/request/get-comments.req.dto";
import { ICreateViewInput } from "@_/view/types/create-view.input.interface";
import { PostForbiddenException, PostNotFoundException, RepositoryBadGatewayException } from "@_/common/custom-error.util";
import { CreatePostReqDto } from "../dto/request/create-post.req.dto";
import { CreatePostResDto } from "../dto/response/create-post.res.dto";
import { ICreatePostReq } from "../types/create-post.req.interface";
import { UpdatePostReqDto } from "../dto/request/update-post.req.dto";
import { IUpdatePostReq } from "../types/update-post.req";
import { IDeletePostQuery } from "../types/delete-post.query.interface";

describe('PostService', () => {
    const mockPostRepository: jest.Mocked<Partial<PostRepository>> = {
        findPostsByCursor: jest.fn(),
        findPosts: jest.fn(),
        findPost: jest.fn(),
        createPost: jest.fn(),
        updatePost: jest.fn(),
        deletePost: jest.fn(),
    };

    const mockTagService: jest.Mocked<Partial<TagService>> = {
        getTagsByPostId: jest.fn(),
        createTags: jest.fn(),
        updateTags: jest.fn(),
        deleteTags: jest.fn(),
    };

    const mockPrismaService: jest.Mocked<Partial<PrismaService>> = {
        $transaction: jest.fn().mockImplementation(async (callback) => {
            const tx = undefined;
            return callback(tx);
        }),
    };

    const mockCommentService: jest.Mocked<Partial<CommentService>> = {
        getCommentCountByPostId: jest.fn(),
        getCommentsFirstPage: jest.fn(),
    };

    const mockViewService: jest.Mocked<Partial<ViewService>> = {
        getViewCountByPostId: jest.fn(),
        createView: jest.fn(),
    };

    const mockPostLikeService: jest.Mocked<Partial<PostLikeService>> = {
        getPostLikeCountByPostId: jest.fn(),
    };

    const mockRedisClient: jest.Mocked<Partial<Redis>> = {
        get: jest.fn(),
        set: jest.fn(),
        del: jest.fn(),
    };

    let service: PostService;
    let repository: jest.Mocked<PostRepository>;
    let tagService: jest.Mocked<TagService>;
    let prismaService: jest.Mocked<PrismaService>;
    let tx: Prisma.TransactionClient;
    let commentService: jest.Mocked<CommentService>;
    let viewService: jest.Mocked<ViewService>;
    let postLikeService: jest.Mocked<PostLikeService>;
    let redisClient: jest.Mocked<Redis>;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                PostService,
                {
                    provide: PostRepository,
                    useValue: mockPostRepository,
                },
                {
                    provide: TagService,
                    useValue: mockTagService,
                },
                {
                    provide: PrismaService,
                    useValue: mockPrismaService,
                },
                {
                    provide: CommentService,
                    useValue: mockCommentService,
                },
                {
                    provide: ViewService,
                    useValue: mockViewService,
                },
                {
                    provide: PostLikeService,
                    useValue: mockPostLikeService,
                },
                {
                    provide: 'REDIS-CLIENT',
                    useValue: mockRedisClient,
                },
            ],
        }).compile();

        service = module.get<PostService>(PostService);
        repository = module.get<jest.Mocked<PostRepository>>(PostRepository);
        tagService = module.get<jest.Mocked<TagService>>(TagService);
        prismaService = module.get<jest.Mocked<PrismaService>>(PrismaService);
        commentService = module.get<jest.Mocked<CommentService>>(CommentService);
        viewService = module.get<jest.Mocked<ViewService>>(ViewService);
        postLikeService = module.get<jest.Mocked<PostLikeService>>(PostLikeService);
        redisClient = module.get<jest.Mocked<Redis>>('REDIS-CLIENT');
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
    const postKey = `posts:1`;
    const tagKey = `${postKey}:tags`;
    const commentKey = `${postKey}:comments:default`;
    const commentsKey = commentKey;
    const commentsCountKey = `${postKey}:comments:count`;
    const viewsCountKey = `${postKey}:views:count`;
    const likesCountKey = `${postKey}:likes:count`;

    describe('getPostsByCursor, 입력: 페이지네이션 데이터, 동작: 여러 게시글 찾아서 반환', () => {
        it('반환: 여러 게시글 객체 배열, 조건: 항상', async () => {
            const foundPosts = [mockPost1, mockPost2];
            const foundTags = [];
            const commentsCount = 0;
            const likesCount = 0;
            const viewsCount = 0;
            const result = foundPosts.map(post => plainToInstance(GetPostResDto, {
                ...post,
                tags: foundTags,
                counts: {
                    viewsCount,
                    likesCount,
                    commentsCount,
                }
            }));
            const getCursorReqDto: GetCursorReqDto = {
                take: 10,
            };
            repository.findPostsByCursor.mockResolvedValue(foundPosts);
            tagService.getTagsByPostId.mockResolvedValue(foundTags);
            commentService.getCommentCountByPostId.mockResolvedValue(commentsCount);
            postLikeService.getPostLikeCountByPostId.mockResolvedValue(likesCount);
            viewService.getViewCountByPostId.mockResolvedValue(viewsCount);

            await expect(service.getPostsByCursor(getCursorReqDto)).resolves.toEqual<GetPostResDto[]>(result);
            expect(repository.findPostsByCursor).toHaveBeenCalledWith<[GetCursorReqDto]>(getCursorReqDto);
            
            expect(tagService.getTagsByPostId).toHaveBeenCalledWith<[number]>(mockPost1.id);
            expect(commentService.getCommentCountByPostId).toHaveBeenCalledWith<[number]>(mockPost1.id);
            expect(postLikeService.getPostLikeCountByPostId).toHaveBeenCalledWith<[number]>(mockPost1.id);
            expect(viewService.getViewCountByPostId).toHaveBeenCalledWith<[number]>(mockPost1.id);

            expect(tagService.getTagsByPostId).toHaveBeenCalledWith<[number]>(mockPost2.id);
            expect(commentService.getCommentCountByPostId).toHaveBeenCalledWith<[number]>(mockPost2.id);
            expect(postLikeService.getPostLikeCountByPostId).toHaveBeenCalledWith<[number]>(mockPost2.id);
            expect(viewService.getViewCountByPostId).toHaveBeenCalledWith<[number]>(mockPost2.id);
        });
    });

    describe('getPosts, 입력: 페이지네이션 데이터, 동작: 여러 게시글 찾아서 반환', () => {
        it('반환: 여러 게시글 객체 배열, 조건: 항상', async () => {
            const foundPosts = [mockPost1, mockPost2];
            const foundTags = [];
            const commentsCount = 0;
            const likesCount = 0;
            const viewsCount = 0;
            const result = foundPosts.map(post => plainToInstance(GetPostResDto, {
                ...post,
                tags: foundTags,
                counts: {
                    viewsCount,
                    likesCount,
                    commentsCount,
                }
            }));
            const getPostsReqDto: GetPostsReqDto = {
                take: 10,
                skip: 1,
            };
            repository.findPosts.mockResolvedValue(foundPosts);
            tagService.getTagsByPostId.mockResolvedValue(foundTags);
            commentService.getCommentCountByPostId.mockResolvedValue(commentsCount);
            postLikeService.getPostLikeCountByPostId.mockResolvedValue(likesCount);
            viewService.getViewCountByPostId.mockResolvedValue(viewsCount);

            await expect(service.getPosts(getPostsReqDto)).resolves.toEqual<GetPostResDto[]>(result);
            expect(repository.findPosts).toHaveBeenCalledWith<[GetPostsReqDto]>(getPostsReqDto);
            
            expect(tagService.getTagsByPostId).toHaveBeenCalledWith<[number]>(mockPost1.id);
            expect(commentService.getCommentCountByPostId).toHaveBeenCalledWith<[number]>(mockPost1.id);
            expect(postLikeService.getPostLikeCountByPostId).toHaveBeenCalledWith<[number]>(mockPost1.id);
            expect(viewService.getViewCountByPostId).toHaveBeenCalledWith<[number]>(mockPost1.id);

            expect(tagService.getTagsByPostId).toHaveBeenCalledWith<[number]>(mockPost2.id);
            expect(commentService.getCommentCountByPostId).toHaveBeenCalledWith<[number]>(mockPost2.id);
            expect(postLikeService.getPostLikeCountByPostId).toHaveBeenCalledWith<[number]>(mockPost2.id);
            expect(viewService.getViewCountByPostId).toHaveBeenCalledWith<[number]>(mockPost2.id);
        });
    });

    describe('getPost, 입력: 게시글 아이디 & 유저 아이디, 동작: 단일 게시글 찾고 조회수 올리고 반환', () => {
        it('반환: 단일 게시글 객체, 조건: 레디스에 없고 db에 있을 때', async () => {
            const foundRedis = null;
            const foundPost = {
                ...mockPost1,
                author: mockUser1,
                tags: [{
                    postId: 1,
                    tagId: 1,
                    tag: {
                        id: 1,
                        createdAt: now,
                        updatedAt: now,
                        deletedAt: null,
                        name: '딸기',
                    }
                }],
                comments: [mockComment1],
            };
            const foundTags = ['딸기'];
            const foundComments = [mockComment1];
            const commentsCount = 1;
            const likesCount = 0;
            const viewsCount = 0;
            const result = plainToInstance(GetPostResDto, {
                ...foundPost,
                tags: foundTags,
                comments: foundComments,
                counts: {
                    viewsCount: viewsCount + 1,
                    commentsCount,
                    likesCount,
                },
            });
            redisClient.get.mockResolvedValue(foundRedis);
            repository.findPost.mockResolvedValue(foundPost);

            tagService.getTagsByPostId.mockResolvedValue(foundTags);
            commentService.getCommentsFirstPage.mockResolvedValue(foundComments);
            commentService.getCommentCountByPostId.mockResolvedValue(commentsCount);
            postLikeService.getPostLikeCountByPostId.mockResolvedValue(likesCount);
            viewService.getViewCountByPostId(viewsCount);

            await expect(service.getPost({ postId, userId })).resolves.toEqual<GetPostResDto>(result);
            expect(redisClient.get).toHaveBeenCalledWith<[string]>(postKey);
            expect(repository.findPost).toHaveBeenCalledWith<[number]>(postId);

            expect(redisClient.set).toHaveBeenCalledWith<[string, string, string, number]>(tagKey, JSON.stringify(foundTags), 'EX', ONE_HOUR_BY_SECOND);
            expect(redisClient.set).toHaveBeenCalledWith<[string, string, string, number]>(commentKey, JSON.stringify(foundComments), 'EX', ONE_HOUR_BY_SECOND);
            expect(redisClient.set).toHaveBeenCalledWith<[string, string, string, number]>(postKey, JSON.stringify(foundPost), 'EX', ONE_HOUR_BY_SECOND);
        
            expect(tagService.getTagsByPostId).toHaveBeenCalledWith<[number]>(postId);
            expect(commentService.getCommentsFirstPage).toHaveBeenCalledWith<[{
                getCommentsReqDto: GetCommentsReqDto,
                postId: number,
            }]>({ getCommentsReqDto: { take: 10 }, postId });
            expect(commentService.getCommentCountByPostId).toHaveBeenCalledWith<[number]>(postId);
            expect(postLikeService.getPostLikeCountByPostId).toHaveBeenCalledWith<[number]>(postId);
            expect(viewService.getViewCountByPostId).toHaveBeenCalledWith<[number]>(postId);

            expect(viewService.createView).toHaveBeenCalledWith<[ICreateViewInput]>({ postId, userId });
        });

        it('반환: 단일 게시글 객체, 조건: 레디스에 있을 때', async () => {
            const foundPost = {
                ...mockPost1,
                author: mockUser1,
                tags: [{
                    postId: 1,
                    tagId: 1,
                    tag: {
                        id: 1,
                        createdAt: now,
                        updatedAt: now,
                        deletedAt: null,
                        name: '딸기',
                    }
                }],
                comments: [mockComment1],
            };
            const foundRedis = JSON.stringify(foundPost);
            const foundTags = ['딸기'];
            const foundComments = [mockComment1];
            const commentsCount = 1;
            const likesCount = 0;
            const viewsCount = 0;
            const result = plainToInstance(GetPostResDto, {
                ...JSON.parse(JSON.stringify(foundPost)),
                tags: foundTags,
                comments: foundComments,
                counts: {
                    viewsCount: viewsCount + 1,
                    commentsCount,
                    likesCount,
                },
            });
            redisClient.get.mockResolvedValue(foundRedis);

            tagService.getTagsByPostId.mockResolvedValue(foundTags);
            commentService.getCommentsFirstPage.mockResolvedValue(foundComments);
            commentService.getCommentCountByPostId.mockResolvedValue(commentsCount);
            postLikeService.getPostLikeCountByPostId.mockResolvedValue(likesCount);
            viewService.getViewCountByPostId(viewsCount);

            await expect(service.getPost({ postId, userId })).resolves.toEqual<GetPostResDto>(result);
            expect(redisClient.get).toHaveBeenCalledWith<[string]>(postKey);
            expect(repository.findPost).not.toHaveBeenCalled();
        
            expect(tagService.getTagsByPostId).toHaveBeenCalledWith<[number]>(postId);
            expect(commentService.getCommentsFirstPage).toHaveBeenCalledWith<[{
                getCommentsReqDto: GetCommentsReqDto,
                postId: number,
            }]>({ getCommentsReqDto: { take: 10 }, postId });
            expect(commentService.getCommentCountByPostId).toHaveBeenCalledWith<[number]>(postId);
            expect(postLikeService.getPostLikeCountByPostId).toHaveBeenCalledWith<[number]>(postId);
            expect(viewService.getViewCountByPostId).toHaveBeenCalledWith<[number]>(postId);

            expect(viewService.createView).toHaveBeenCalledWith<[ICreateViewInput]>({ postId, userId });
        });

        it('반환: NotFoundError, 조건: db에 없을 때', async () => {
            redisClient.get.mockResolvedValue(null);
            repository.findPost.mockResolvedValue(null);

            await expect(service.getPost({ postId, userId })).rejects.toThrow(PostNotFoundException);
            expect(redisClient.get).toHaveBeenCalledWith<[string]>(postKey);
            expect(repository.findPost).toHaveBeenCalledWith<[number]>(postId);
            expect(redisClient.set).not.toHaveBeenCalled();
        });
    });

    describe('createPost, 입력: 게시글 생성 데이터 & 유저 아이디, 동작: 게시글과 태그 생성 후 레디스 저장 후 반환', () => {
        it('반환: 단일 게시글 생성 객체, 조건: 트랜잭션 성공', async () => {
            const createdPost = plainToInstance(CreatePostResDto, mockPost1);
            const createPostReqDto: CreatePostReqDto = {
                title: mockPost1.title,
                content: mockPost1.content,
                tags: ['딸기'],
            };
            repository.createPost.mockResolvedValue(mockPost1);

            await service.createPost({ createPostReqDto, userId })
            await expect(service.createPost({ createPostReqDto, userId })).resolves.toEqual<CreatePostResDto>(createdPost);
            expect(prismaService.$transaction).toHaveBeenCalled();
            expect(repository.createPost).toHaveBeenCalledWith<[Prisma.TransactionClient, ICreatePostReq]>(tx, {
                title: createPostReqDto.title,
                content: createPostReqDto.content,
                authorId: userId,
            });
            expect(tagService.createTags).toHaveBeenCalledWith<[Prisma.TransactionClient, {
                tags: string[],
                postId: number,
            }]>(tx, { tags: createPostReqDto.tags, postId: mockPost1.id });
            expect(redisClient.set).toHaveBeenCalledWith<[string, string, string, number]>(postKey, JSON.stringify(mockPost1), 'EX', ONE_HOUR_BY_SECOND);
        });
    });

    describe('updatePost, 입력: 수정 데이터 & 게시글 아이디 & 유저 아이디, 동작: 게시글 수정 후 레디스 등록', () => {
        it('반환: undefined, 조건: 수정 성공', async () => {
            const updatedResult: Prisma.BatchPayload = { count: 1 };
            const updatePostReqDto: UpdatePostReqDto = {
                content: '본문',
                tags: ['달기'],
            };
            repository.updatePost.mockResolvedValue(updatedResult);
            repository.findPost.mockResolvedValue(mockPost1);

            await expect(service.updatePost({ updatePostReqDto, postId, userId })).resolves.toEqual<void>(undefined);
            expect(prismaService.$transaction).toHaveBeenCalled();
            expect(repository.updatePost).toHaveBeenCalledWith<[Prisma.TransactionClient, {
                data: IUpdatePostReq,
                postId: number,
                userId: number,
            }]>(tx, {
                data: {
                    title: updatePostReqDto.title,
                    content: updatePostReqDto.content,
                },
                postId,
                userId,
            });
            expect(tagService.updateTags).toHaveBeenCalledWith<[Prisma.TransactionClient, {
                tags: string[],
                postId: number,
            }]>(tx, { tags: updatePostReqDto.tags, postId });
            expect(repository.findPost).toHaveBeenCalledWith<[number]>(postId);
            expect(redisClient.set).toHaveBeenCalledWith<[string, string, string, number]>(postKey, JSON.stringify(mockPost1), 'EX', ONE_HOUR_BY_SECOND);
        });

        it('반환: NotFoundError, 조건: 게시글 없음', async () => {
            const updatedResult: Prisma.BatchPayload = { count: 0 };
            const updatePostReqDto: UpdatePostReqDto = {
                content: '본문',
                tags: ['달기'],
            };
            repository.updatePost.mockResolvedValue(updatedResult);
            repository.findPost.mockResolvedValue(null);

            await expect(service.updatePost({ updatePostReqDto, postId, userId })).rejects.toThrow(PostNotFoundException);
            expect(prismaService.$transaction).toHaveBeenCalled();
            expect(repository.updatePost).toHaveBeenCalledWith<[Prisma.TransactionClient, {
                data: IUpdatePostReq,
                postId: number,
                userId: number,
            }]>(tx, {
                data: {
                    title: updatePostReqDto.title,
                    content: updatePostReqDto.content,
                },
                postId,
                userId,
            });
            expect(tagService.updateTags).not.toHaveBeenCalled();

            expect(repository.findPost).toHaveBeenCalledWith<[number]>(postId);

        });

        it('반환: ForbiddenError, 조건: 권한 없음', async () => {
            const updatedResult: Prisma.BatchPayload = { count: 0 };
            const updatePostReqDto: UpdatePostReqDto = {
                content: '본문',
                tags: ['달기'],
            };
            repository.updatePost.mockResolvedValue(updatedResult);
            repository.findPost.mockResolvedValue(mockPost2);

            await expect(service.updatePost({ updatePostReqDto, postId, userId })).rejects.toThrow(PostForbiddenException);
            expect(prismaService.$transaction).toHaveBeenCalled();
            expect(repository.updatePost).toHaveBeenCalledWith<[Prisma.TransactionClient, {
                data: IUpdatePostReq,
                postId: number,
                userId: number,
            }]>(tx, {
                data: {
                    title: updatePostReqDto.title,
                    content: updatePostReqDto.content,
                },
                postId,
                userId,
            });
            expect(tagService.updateTags).not.toHaveBeenCalled();

            expect(repository.findPost).toHaveBeenCalledWith<[number]>(postId);

        });
    });

    describe('deletePost, 입력: 게시글 아이디 & 유저 아이디, 동작: 단일 게시글 삭제 후 레디스 키 삭제', () => {
        it('반환: undefined, 조건: 삭제 성공', async () => {
            const deletedResult: Prisma.BatchPayload = { count: 1 };
            repository.deletePost.mockResolvedValue(deletedResult);

            await expect(service.deletePost({ postId, userId })).resolves.toEqual<void>(undefined);
            expect(prismaService.$transaction).toHaveBeenCalled();
            expect(repository.deletePost).toHaveBeenCalledWith<[Prisma.TransactionClient, IDeletePostQuery]>(tx, { postId, userId });
            
            expect(tagService.deleteTags).toHaveBeenCalledWith<[Prisma.TransactionClient, number]>(tx, postId);
            expect(redisClient.del).toHaveBeenCalledWith<[string]>(postKey);
            expect(redisClient.del).toHaveBeenCalledWith<[string]>(commentsKey);
            expect(redisClient.del).toHaveBeenCalledWith<[string]>(commentsCountKey);
            expect(redisClient.del).toHaveBeenCalledWith<[string]>(viewsCountKey);
            expect(redisClient.del).toHaveBeenCalledWith<[string]>(likesCountKey);
        });

        it('반환: NotFoundError, 조건: 게시글 없음', async () => {
            const deletedResult: Prisma.BatchPayload = { count: 0 };
            repository.deletePost.mockResolvedValue(deletedResult);
            repository.findPost.mockResolvedValue(null);

            await expect(service.deletePost({ postId, userId })).rejects.toThrow(PostNotFoundException);
            expect(prismaService.$transaction).toHaveBeenCalled();
            expect(repository.deletePost).toHaveBeenCalledWith<[Prisma.TransactionClient, IDeletePostQuery]>(tx, { postId, userId });
            
            expect(tagService.deleteTags).not.toHaveBeenCalled();
            expect(repository.findPost).toHaveBeenCalledWith<[number]>(postId);
        });

        it('반환: ForbiddenError, 조건: 권한 없음', async () => {
            const deletedResult: Prisma.BatchPayload = { count: 0 };
            repository.deletePost.mockResolvedValue(deletedResult);
            repository.findPost.mockResolvedValue(mockPost2);

            await expect(service.deletePost({ postId, userId })).rejects.toThrow(PostForbiddenException);
            expect(prismaService.$transaction).toHaveBeenCalled();
            expect(repository.deletePost).toHaveBeenCalledWith<[Prisma.TransactionClient, IDeletePostQuery]>(tx, { postId, userId });
            
            expect(tagService.deleteTags).not.toHaveBeenCalled();
            expect(repository.findPost).toHaveBeenCalledWith<[number]>(postId);
        });
    });
});