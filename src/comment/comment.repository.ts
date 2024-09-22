import { PrismaService } from "@_/prisma/prisma.service";
import { Injectable, Logger } from "@nestjs/common";
import { Comment, Prisma } from "@prisma/client";
import { ICreateCommentInput } from "./types/create-comment.input.interface";
import { IGetCommentsInput } from "./types/get-comments.input.interface";
import { RepositoryBadGatewayException } from "@_/common/custom-error.util";
import { IDeleteCommentInput } from "./types/delete-comment.input.interface";

@Injectable()
export class CommentRepository {
    private readonly logger = new Logger(CommentRepository.name);

    constructor(
        private readonly prismaService: PrismaService,
    ) {}

    async findCommentCountByPostId(postId: number): Promise<number> {
        const where = {
            postId,
            deletedAt: null,
        };
        try {
            return await this.prismaService.comment.count({ where });
        } catch(err) {
            this.logger.error(err);
            throw new RepositoryBadGatewayException(err.message);
        }
    }

    async findCommentsByPostId({ postId, take, cursor }: IGetCommentsInput): Promise<Comment[]> {
        const where = {
            postId,
            deletedAt: null,
        };
        const skip = cursor ? 1 : 0;
        const optionalCursor = cursor && { cursor: { id: cursor }};
        try {
            return await this.prismaService.comment.findMany({
                where,
                orderBy: {
                    id: 'desc',
                },
                include: {
                    author: true,
                },
                take,
                skip,
                ...optionalCursor,
            });
        } catch(err) {
            this.logger.error(err);
            throw new RepositoryBadGatewayException(err.message);
        }
    }

    async findComment(commentId: number): Promise<Comment> {
        const where = {
            id: commentId,
            deletedAt: null,
        };
        try {
            return await this.prismaService.comment.findUnique({ where });
        } catch(err) {
            this.logger.error(err);
            throw new RepositoryBadGatewayException(err.message);
        }
    }

    async createComment(data: ICreateCommentInput): Promise<Comment> {
        try {
            const createdComment = await this.prismaService.comment.create({
                data
            });
            return createdComment;
        } catch(err) {
            this.logger.error(err);
            throw new RepositoryBadGatewayException(err.message);
        }
    }

    async updateComment({data, commentId, userId}: {
        data: Prisma.CommentUpdateInput;
        commentId: number;
        userId: number;
    }): Promise<Prisma.BatchPayload> {
        const where = {
            id: commentId,
            authorId: userId,
            deletedAt: null,
        };
        try {
            const updatedResult = await this.prismaService.comment.updateMany({
                data,
                where,
            });
            return updatedResult;
        } catch(err) {
            this.logger.error(err);
            throw new RepositoryBadGatewayException(err.message);
        }
    }

    async deleteComment({ commentId, userId }: IDeleteCommentInput): Promise<Prisma.BatchPayload> {
        const where = {
            id: commentId,
            authorId: userId,
            deletedAt: null,
        };
        const data = {
            deletedAt: new Date(),
        }
        try {
            const deletedResult = await this.prismaService.comment.updateMany({
                where,
                data
            });
            return deletedResult;
        } catch(err) {
            this.logger.error(err);
            throw new RepositoryBadGatewayException(err.message);
        }
    }
}