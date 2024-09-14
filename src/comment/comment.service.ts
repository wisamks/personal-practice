import { Inject, Injectable, Logger } from '@nestjs/common';
import { CommentRepository } from './comment.repository';
import { COMMENT_DELETE_TAKE } from './constants/comment.constant';
import { CreateCommentReqDto } from './dto/request/create-comment.req.dto';
import { plainToInstance } from 'class-transformer';
import { CreateCommentResDto } from './dto/response/create-comment.res.dto';
import { GetCommentsReqDto } from './dto/request/get-comments.req.dto';
import { GetCommentResDto } from './dto/response/get-comment.res.dto';
import { UpdateCommentReqDto } from './dto/request/update-comment.req.dto';
import { ONE_HOUR_BY_SECOND, REDIS_COMMENTS, REDIS_COUNT, REDIS_DEFAULT_PAGE, REDIS_POSTS } from '@_/redis/constants/redis.constant';
import { Redis } from 'ioredis';
import { Comment } from '@prisma/client';
import { CommentForbiddenException, CommentNotFoundException } from '@_/common/custom-error.util';

@Injectable()
export class CommentService {
    private readonly logger = new Logger(CommentService.name);

    constructor(
        private readonly commentRepository: CommentRepository,
        @Inject('REDIS-CLIENT')
        private readonly redisClient: Redis,
    ) {}

    async getCommentsCountByPostId(postId: number): Promise<number> {
        const commentsCountKey = [REDIS_POSTS, postId, REDIS_COMMENTS, REDIS_COUNT].join(':');

        const redisCommentsCount = await this.redisClient.get(commentsCountKey);
        if (redisCommentsCount) {
            return Number(redisCommentsCount);
        }

        const dbCommentsCount = await this.commentRepository.getCommentsCountByPostId(postId);
        await this.redisClient.set(commentsCountKey, String(dbCommentsCount), 'EX', ONE_HOUR_BY_SECOND);
        return dbCommentsCount;
    }

    async getCommentsFirstPage({ getCommentsReqDto, postId }: {
        getCommentsReqDto: GetCommentsReqDto;
        postId: number;
    }): Promise<Comment[]> {
        const commentsKey = [REDIS_POSTS, postId, REDIS_COMMENTS, REDIS_DEFAULT_PAGE].join(':');
        const redisComments = await this.redisClient.get(commentsKey);
        if (redisComments) {
            return JSON.parse(redisComments);
        }

        const foundComments = await this.commentRepository.getCommentsByPostId({
            ...getCommentsReqDto,
            postId,
        });
        await this.redisClient.set(commentsKey, JSON.stringify(foundComments), 'EX', ONE_HOUR_BY_SECOND);
        return foundComments;
    }

    async getCommentsByPostId({ getCommentsReqDto, postId }: {
        getCommentsReqDto: GetCommentsReqDto;
        postId: number;
    }): Promise<GetCommentResDto[]> {
        const foundComments = await this.commentRepository.getCommentsByPostId({
            ...getCommentsReqDto,
            postId,
        });
        return foundComments.map((foundComment) => plainToInstance(GetCommentResDto, foundComment));
    }

    async createComment({ createCommentReqDto, postId, userId }: {
        createCommentReqDto: CreateCommentReqDto;
        postId: number;
        userId: number;
    }): Promise<CreateCommentResDto> {
        const commentsKey = [REDIS_POSTS, postId, REDIS_COMMENTS, REDIS_DEFAULT_PAGE].join(':');
        const commentsCountKey = [REDIS_POSTS, postId, REDIS_COMMENTS, REDIS_COUNT].join(':');

        const createdResult = await this.commentRepository.createComment({
            ...createCommentReqDto,
            postId,
            authorId: userId,
        });

        // 레디스
        const redisCommentsCount = await this.redisClient.get(commentsCountKey);
        if (redisCommentsCount) {
            await this.redisClient.incr(commentsCountKey);
        }
        await this.redisClient.del(commentsKey);

        return plainToInstance(CreateCommentResDto, createdResult);
    }

    async updateComment({ updateCommentReqDto, userId, commentId }: {
        updateCommentReqDto: UpdateCommentReqDto;
        userId: number;
        commentId: number;
    }): Promise<void> {
        const foundComment = await this.commentRepository.getComment(commentId);
        if (!foundComment) {
            throw new CommentNotFoundException();
        }
        if (foundComment.authorId !== userId) {
            throw new CommentForbiddenException();
        }

        // 레디스
        const commentsKey = [REDIS_POSTS, foundComment.postId, REDIS_COMMENTS, REDIS_DEFAULT_PAGE].join(':');
        await this.redisClient.del(commentsKey);
        
        return await this.commentRepository.updateComment({
            data: updateCommentReqDto,
            commentId,
        });
    }

    async deleteComment({ commentId, userId }: {
        commentId: number,
        userId: number,
    }): Promise<GetCommentResDto> {
        const foundComment = await this.commentRepository.getComment(commentId);
        if (!foundComment) {
            throw new CommentNotFoundException();
        }
        if (foundComment.authorId !== userId) {
            throw new CommentForbiddenException();
        }
        const nextComment = await this.commentRepository.getCommentsByPostId({
            postId: foundComment.postId,
            cursor: commentId,
            take: COMMENT_DELETE_TAKE,
        });
        await this.commentRepository.deleteComment(commentId);

        // 레디스
        const commentsKey = [REDIS_POSTS, foundComment.postId, REDIS_COMMENTS, REDIS_DEFAULT_PAGE].join(':');
        const commentsCountKey = [REDIS_POSTS, foundComment.postId, REDIS_COMMENTS, REDIS_COUNT].join(':');
        await Promise.all([
            this.redisClient.del(commentsKey),
            this.redisClient.decr(commentsCountKey)
        ]);

        return plainToInstance(GetCommentResDto, nextComment[0]);
    }
}
