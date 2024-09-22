import { Inject, Injectable, Logger } from '@nestjs/common';
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
import { POST_GET_COMMENT_REQ } from './constants/post.constant';
import { CommentService } from '@_/comment/comment.service';
import { ViewService } from '@_/view/view.service';
import { PostLikeService } from '@_/post-like/post-like.service';
import { Redis } from 'ioredis';
import { Post } from '@prisma/client';
import { ONE_HOUR_BY_SECOND, REDIS_COMMENTS, REDIS_COUNT, REDIS_DEFAULT_PAGE, REDIS_LIKES, REDIS_POSTS, REDIS_TAGS, REDIS_VIEWS } from '@_/redis/constants/redis.constant';
import { PostForbiddenException, PostInternalServerErrorException, PostNotFoundException } from '@_/common/custom-error.util';
import { IDeletePostQuery } from './types/delete-post.query.interface';

@Injectable()
export class PostService {
    private readonly logger = new Logger(PostService.name);

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
        const foundPosts = await this.postRepository.findPostsByCursor(getCursorReqDto);
        const result = [];
        for (const foundPost of foundPosts) {
            const [
                foundTags, 
                commentsCount,
                likesCount,
                viewsCount,
            ] = await Promise.all([
                this.tagService.getTagsByPostId(foundPost.id),
                this.commentService.getCommentCountByPostId(foundPost.id),
                this.postLikeService.getPostLikeCountByPostId(foundPost.id),
                this.viewService.getViewCountByPostId(foundPost.id),
            ]);
            result.push(plainToInstance(GetPostResDto, { 
                ...foundPost, 
                tags: foundTags,
                counts: {
                    viewsCount,
                    commentsCount,
                    likesCount,
                },
            }))
        }
        return result;
    }

    async getPosts(getPostsReqDto: GetPostsReqDto): Promise<GetPostResDto[]> {
        const foundPosts = await this.postRepository.findPosts(getPostsReqDto);
        const result = [];
        for (const foundPost of foundPosts) {
            const [
                foundTags, 
                commentsCount,
                likesCount,
                viewsCount,
            ] = await Promise.all([
                this.tagService.getTagsByPostId(foundPost.id),
                this.commentService.getCommentCountByPostId(foundPost.id),
                this.postLikeService.getPostLikeCountByPostId(foundPost.id),
                this.viewService.getViewCountByPostId(foundPost.id),
            ]);
            result.push(plainToInstance(GetPostResDto, { 
                ...foundPost, 
                tags: foundTags,
                counts: {
                    viewsCount,
                    commentsCount,
                    likesCount,
                },
            }))
        }
        return result;
    }

    async getPost({ postId, userId }: {
        postId: number,
        userId: number,
    }): Promise<GetPostResDto> {
        const postKey = [REDIS_POSTS, postId].join(':');
        const tagKey = [postKey, REDIS_TAGS].join(':');
        const commentKey = [postKey, REDIS_COMMENTS, REDIS_DEFAULT_PAGE].join(':');

        // 기본 post 가져오고 없으면 에러
        let foundPost: Post;
        const redisPost = await this.redisClient.get(postKey);
        if (redisPost) {
            foundPost = JSON.parse(redisPost);
        } else {
            const dbPost = await this.postRepository.findPost(postId);
            if (!dbPost) {
                throw new PostNotFoundException();
            }
            const dbTags = dbPost.tags.map(tag => tag.tag.name);
            const dbComments = dbPost.comments;

            await Promise.all([
                this.redisClient.set(tagKey, JSON.stringify(dbTags), 'EX', ONE_HOUR_BY_SECOND),
                this.redisClient.set(commentKey, JSON.stringify(dbComments), 'EX', ONE_HOUR_BY_SECOND),
                this.redisClient.set(postKey, JSON.stringify(dbPost), 'EX', ONE_HOUR_BY_SECOND),
            ]);
            foundPost = dbPost;
        }

        const [
            foundTags,
            foundComments,
            commentsCount,
            likesCount,
            viewsCount,
        ] = await Promise.all([
            this.tagService.getTagsByPostId(postId),
            this.commentService.getCommentsFirstPage({
                getCommentsReqDto: POST_GET_COMMENT_REQ,
                postId,
            }),
            this.commentService.getCommentCountByPostId(postId),
            this.postLikeService.getPostLikeCountByPostId(postId),
            this.viewService.getViewCountByPostId(postId)
        ]);
        
        // 조회 수 올리기
        await this.viewService.createView({ postId, userId })

        // 각 정보들 객체로 저장
        const responseDto = {
            ...foundPost,
            tags: foundTags,
            comments: foundComments,
            counts: {
                viewsCount: viewsCount + 1,
                commentsCount,
                likesCount
            },
        };

        return plainToInstance(GetPostResDto, responseDto);
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

            // 레디스 write through
            const postKey = [REDIS_POSTS, createdPost.id].join(':');
            const foundPost = await this.postRepository.findPost(createdPost.id);
            await this.redisClient.set(postKey, JSON.stringify(foundPost), 'EX', ONE_HOUR_BY_SECOND);
            
            return plainToInstance(CreatePostResDto, createdPost);
        });
    }

    async updatePost({ updatePostReqDto, postId, userId }: {
        updatePostReqDto: UpdatePostReqDto;
        postId: number;
        userId: number;
    }): Promise<void> {
        const postKey = [REDIS_POSTS, postId].join(':');

        const { title, content, tags } = updatePostReqDto;

        await this.prismaService.$transaction( async tx => { 
            const updatedResult = await this.postRepository.updatePost(tx, { data: { title, content }, postId, userId });
            if (updatedResult.count) {
                await this.tagService.updateTags(tx, { tags, postId });
                // 레디스 write through
                const updatedPost = await this.postRepository.findPost(postId);
                await this.redisClient.set(postKey, JSON.stringify(updatedPost), 'EX', ONE_HOUR_BY_SECOND);
                
                return;
            }
            const foundPost = await this.postRepository.findPost(postId);
            if (!foundPost) {
                throw new PostNotFoundException();
            }
            if (foundPost.authorId !== userId) {
                throw new PostForbiddenException();
            }
            throw new PostInternalServerErrorException();
        });
        return;
    }

    async deletePost({ postId, userId }: IDeletePostQuery): Promise<void> {
        const postKey = [REDIS_POSTS, postId].join(':');
        const commentsKey = [postKey, REDIS_COMMENTS, REDIS_DEFAULT_PAGE].join(':');
        const commentsCountKey = [postKey, REDIS_COMMENTS, REDIS_COUNT].join(':');
        const viewsCountKey = [postKey, REDIS_VIEWS, REDIS_COUNT].join(':');
        const likesCountKey = [postKey, REDIS_LIKES, REDIS_COUNT].join(':');
        
        return await this.prismaService.$transaction( async tx => {
            const deletedResult = await this.postRepository.deletePost(tx, { postId, userId });
            if (deletedResult.count) {
                await Promise.all([
                    this.tagService.deleteTags(tx, postId),
                    this.redisClient.del(postKey),
                    this.redisClient.del(commentsKey),
                    this.redisClient.del(commentsCountKey),
                    this.redisClient.del(viewsCountKey),
                    this.redisClient.del(likesCountKey),
                ])
                return;
            }
            const foundPost = await this.postRepository.findPost(postId);
            if (!foundPost) {
                throw new PostNotFoundException();
            }
            if (foundPost.authorId !== userId) {
                throw new PostForbiddenException();
            }
            throw new PostInternalServerErrorException();
        });
    }
}
