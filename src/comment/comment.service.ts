import { Injectable, Logger } from '@nestjs/common';
import { CommentRepository } from './comment.repository';
import { COMMENT_SERVICE } from './constants/comment.constant';
import { CreateCommentReqDto } from './dto/request/create-comment.req.dto';
import { plainToInstance } from 'class-transformer';
import { CreateCommentResDto } from './dto/response/create-comment.res.dto';
import { GetCommentsReqDto } from './dto/request/get-comments.req.dto';
import { GetCommentResDto } from './dto/response/get-comment.res.dto';

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
}
