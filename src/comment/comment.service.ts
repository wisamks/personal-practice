import { ForbiddenException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { CommentRepository } from './comment.repository';
import { COMMENT_DELETE_TAKE, COMMENT_FORBIDDEN_ERROR_MESSAGE, COMMENT_NOT_FOUND_ERROR_MESSAGE, COMMENT_SERVICE } from './constants/comment.constant';
import { CreateCommentReqDto } from './dto/request/create-comment.req.dto';
import { plainToInstance } from 'class-transformer';
import { CreateCommentResDto } from './dto/response/create-comment.res.dto';
import { GetCommentsReqDto } from './dto/request/get-comments.req.dto';
import { GetCommentResDto } from './dto/response/get-comment.res.dto';
import { UpdateCommentReqDto } from './dto/request/update-comment.req.dto';

@Injectable()
export class CommentService {
    private readonly logger = new Logger(COMMENT_SERVICE);

    constructor(
        private readonly commentRepository: CommentRepository,
    ) {}

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
        const createdResult = await this.commentRepository.createComment({
            ...createCommentReqDto,
            postId,
            authorId: userId,
        });
        return plainToInstance(CreateCommentResDto, createdResult);
    }

    async updateComment({ updateCommentReqDto, userId, commentId }: {
        updateCommentReqDto: UpdateCommentReqDto;
        userId: number;
        commentId: number;
    }): Promise<void> {
        const foundComment = await this.commentRepository.getComment(commentId);
        if (!foundComment) {
            throw new NotFoundException(COMMENT_NOT_FOUND_ERROR_MESSAGE);
        }
        if (foundComment.authorId !== userId) {
            throw new ForbiddenException(COMMENT_FORBIDDEN_ERROR_MESSAGE);
        }
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
            throw new NotFoundException(COMMENT_NOT_FOUND_ERROR_MESSAGE);
        }
        if (foundComment.authorId !== userId) {
            throw new ForbiddenException(COMMENT_FORBIDDEN_ERROR_MESSAGE);
        }
        const nextComment = await this.commentRepository.getCommentsByPostId({
            postId: foundComment.postId,
            cursor: commentId,
            take: COMMENT_DELETE_TAKE,
        });
        await this.commentRepository.deleteComment(commentId);
        return plainToInstance(GetCommentResDto, nextComment[0]);
    }
}
