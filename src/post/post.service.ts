import { ForbiddenException, Inject, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PostRepository } from './post.repository';
import { CreatePostReqDto } from './dto/request/create-post.req.dto';
import { TagService } from '@_/tag/tag.service';
import { plainToInstance } from 'class-transformer';
import { GetPostResDto } from './dto/response/get-post.res.dto';
import { GetPostsReqDto } from './dto/request/get-posts.req.dto';
import { PrismaService } from '@_/prisma/prisma.service';
import { CreatePostResDto } from './dto/response/create-post.res.dto';
import { UpdatePostReqDto } from './dto/request/update-post.req.dto';
import { GetCursorReqDto } from './dto/request/get-cursor.req.dto';
import { ONE_HOUR_BY_SECOND, POST_FORBIDDEN_ERROR_MESSAGE, POST_GET_COMMENT_REQ, POST_NOT_FOUND_ERROR_MESSAGE, POST_SERVICE, REDIS_COMMENTS, REDIS_COUNT, REDIS_DEFAULT_PAGE, REDIS_LIKES, REDIS_POSTS, REDIS_TAGS, REDIS_VIEWS } from './constants/post.constant';
import { CommentService } from '@_/comment/comment.service';
import { ViewService } from '@_/view/view.service';
import { PostLikeService } from '@_/post-like/post-like.service';
import { Redis } from 'ioredis';
import { Post } from '@prisma/client';
import { GetCommentResDto } from '@_/comment/dto/response/get-comment.res.dto';

@Injectable()
export class PostService {
    private readonly logger = new Logger(POST_SERVICE);

    constructor(
        private readonly postRepository: PostRepository,
        private readonly tagService: TagService,
        private readonly prismaService: PrismaService,
        private readonly commentService: CommentService,
        private readonly viewService: ViewService,
        private readonly postLikeService: PostLikeService,
        @Inject('REDIS-CLIENT')
        private readonly redisClient: Redis,
    ) {}

    async getPostsByCursor(getCursorReqDto: GetCursorReqDto): Promise<GetPostResDto[]> {
        const foundPosts = await this.postRepository.getPostsByCursor(getCursorReqDto);
        const result = [];
        for (const foundPost of foundPosts) {
            const foundTags = await this.tagService.getTagsByPostId(foundPost.id);
            result.push(plainToInstance(GetPostResDto, { ...foundPost, tags: foundTags }))
        }
        return result;
    }

    async getPosts(getPostsReqDto: GetPostsReqDto): Promise<GetPostResDto[]> {
        const foundPosts = await this.postRepository.getPosts(getPostsReqDto);
        const result = [];
        for (const foundPost of foundPosts) {
            const foundTags = await this.tagService.getTagsByPostId(foundPost.id);
            result.push(plainToInstance(GetPostResDto, { ...foundPost, tags: foundTags }))
        }
        return result;
    }

    async getPost({ postId, userId }: {
        postId: number,
        userId: number,
    }): Promise<GetPostResDto> {
        const postKey = [REDIS_POSTS, postId].join(':');
        const tagsKey = [postKey, REDIS_TAGS].join(':');
        const commentsKey = [postKey, REDIS_COMMENTS, REDIS_DEFAULT_PAGE].join(':');
        const commentsCountKey = [postKey, REDIS_COMMENTS, REDIS_COUNT].join(':');
        const viewsCountKey = [postKey, REDIS_VIEWS, REDIS_COUNT].join(':');
        const likesCountKey = [postKey, REDIS_LIKES, REDIS_COUNT].join(':');

        // 기본 post 가져오고 없으면 에러
        let foundPost: Post;
        const redisPost = await this.redisClient.get(postKey);
        if (redisPost) {
            foundPost = JSON.parse(redisPost);
        } else {
            const dbPost = await this.postRepository.getPost(postId);
            if (!dbPost) {
                throw new NotFoundException(POST_NOT_FOUND_ERROR_MESSAGE);
            }
            await this.redisClient.set(postKey, JSON.stringify(dbPost), 'EX', ONE_HOUR_BY_SECOND);
            foundPost = dbPost;
        }
        
        // 태그 가져오기
        let foundTags: string[];
        const redisTags = await this.redisClient.get(tagsKey);
        if (redisTags) {
            foundTags = JSON.parse(redisTags);
        } else {
            const dbTags = await this.tagService.getTagsByPostId(postId);
            await this.redisClient.set(tagsKey, JSON.stringify(dbTags), 'EX', ONE_HOUR_BY_SECOND);
            foundTags = dbTags;
        }

        // 댓글 첫 페이지 가져오기
        let foundComments: GetCommentResDto[];
        const redisComments = await this.redisClient.get(commentsKey);
        if (redisComments) {
            foundComments = JSON.parse(redisComments);
        } else {
            const dbComments = await this.commentService.getCommentsByPostId({
                getCommentsReqDto: POST_GET_COMMENT_REQ,
                postId,
            });
            await this.redisClient.set(commentsKey, JSON.stringify(dbComments), 'EX', ONE_HOUR_BY_SECOND);
            foundComments = dbComments;
        }

        // 댓글 수 가져오기
        let commentsCount: number;
        const redisCommentsCount = await this.redisClient.get(commentsCountKey);
        if (redisCommentsCount) {
            commentsCount = Number(redisCommentsCount);
        } else {
            const dbCommentsCount = await this.commentService.getCommentsCountByPostId(postId);
            await this.redisClient.set(commentsCountKey, String(dbCommentsCount), 'EX', ONE_HOUR_BY_SECOND);
            commentsCount = dbCommentsCount;
        }

        // 좋아요 수 가져오기
        let likesCount: number;
        const redisLikesCount = await this.redisClient.get(likesCountKey);
        if (redisLikesCount) {
            likesCount = Number(redisLikesCount);
        } else {
            const dbLikesCount = await this.postLikeService.getPostLikesCountByPostId(postId);
            await this.redisClient.set(likesCountKey, String(dbLikesCount), 'EX', ONE_HOUR_BY_SECOND);
            likesCount = dbLikesCount;
        }
        
        // 조회 수 가져오기
        let viewsCount: number;
        const redisViewsCount = await this.redisClient.get(viewsCountKey);
        if (redisViewsCount) {
            viewsCount = Number(redisViewsCount) + 1;
        } else {
            const dbViewsCount = await this.viewService.getViewCountByPostId(postId);
            await this.redisClient.set(viewsCountKey, String(dbViewsCount), 'EX', ONE_HOUR_BY_SECOND);
            viewsCount = dbViewsCount + 1;
        }
        await this.redisClient.incr(viewsCountKey);
        await this.viewService.createView({ postId, userId })

        // 각 정보들 객체로 저장
        const responseDto = {
            ...foundPost,
            tags: foundTags,
            counts: {
                viewsCount,
                commentsCount,
                likesCount
            },
        };

        return {
            ...plainToInstance(GetPostResDto, responseDto),
            comments: foundComments
        };
    }

    async createPost({createPostReqDto, userId}: {
        createPostReqDto: CreatePostReqDto;
        userId: number;
    }): Promise<CreatePostResDto> {
        const { title, content, tags } = createPostReqDto;

        return await this.prismaService.$transaction(async tx => {
            const createdPost = await this.postRepository.createPost(tx, { title, content, authorId: userId });
            if (tags && createdPost) {
                await this.tagService.createTags(tx, { tags, postId: createdPost.id });
            }
            return plainToInstance(CreatePostResDto, createdPost);
        });
    }

    async updatePost({ updatePostReqDto, postId, userId }: {
        updatePostReqDto: UpdatePostReqDto;
        postId: number;
        userId: number;
    }): Promise<void> {
        const { title, content, tags } = updatePostReqDto;
        const foundPost = await this.postRepository.getPost(postId);
        if (!foundPost) {
            throw new NotFoundException(POST_NOT_FOUND_ERROR_MESSAGE);
        }
        if (foundPost.authorId !== userId) {
            throw new ForbiddenException(POST_FORBIDDEN_ERROR_MESSAGE);
        }

        return await this.prismaService.$transaction( async tx => { 
            await Promise.all([
                this.postRepository.updatePost(tx, { data: { title, content }, postId }),
                this.tagService.deleteTags(tx, postId),
            ]);
            if (tags) {
                await this.tagService.createTags(tx, { tags, postId });
            }
            return;
        });
           
    }

    async deletePost({ postId, userId }: {
        postId: number;
        userId: number;
    }): Promise<void> {
        const foundPost = await this.postRepository.getPost(postId);
        if (!foundPost) {
            throw new NotFoundException(POST_NOT_FOUND_ERROR_MESSAGE);
        }
        if (foundPost.authorId !== userId) {
            throw new ForbiddenException(POST_FORBIDDEN_ERROR_MESSAGE);
        }
        
        return await this.prismaService.$transaction( async tx => {
            await Promise.all([
                this.postRepository.deletePost(tx, postId),
                this.tagService.deleteTags(tx, postId),
            ]);
            return;
        });
    }
}
