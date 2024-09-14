import { PrismaService } from "@_/prisma/prisma.service";
import { Injectable, Logger } from "@nestjs/common";
import { Comment, Prisma } from "@prisma/client";
import { ICreateCommentInput } from "./types/create-comment.input.interface";
import { IGetCommentsInput } from "./types/get-comments.input.interface";
import { RepositoryBadGatewayException } from "@_/common/custom-error.util";

@Injectable()
export class CommentRepository {
    private readonly logger = new Logger(CommentRepository.name);

    constructor(
        private readonly prismaService: PrismaService,
    ) {}

    async getCommentsCountByPostId(postId: number): Promise<number> {
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

    async getCommentsByPostId({ postId, take, cursor }: IGetCommentsInput): Promise<Comment[]> {
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

    async getComment(commentId: number): Promise<Comment> {
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

    async createComment(data: ICreateCommentInput): Promise<Pick<Comment, 'id'>> {
        try {
            const createdComment = await this.prismaService.comment.create({
                data
            });
            return { id: createdComment.id };
        } catch(err) {
            this.logger.error(err);
            throw new RepositoryBadGatewayException(err.message);
        }
    }

    async updateComment({data, commentId}: {
        data: Prisma.CommentUpdateInput;
        commentId: number;
    }): Promise<void> {
        const where = {
            id: commentId,
            deletedAt: null,
        };
        try {
            await this.prismaService.comment.update({
                data,
                where,
            });
            return;
        } catch(err) {
            this.logger.error(err);
            throw new RepositoryBadGatewayException(err.message);
        }
    }

    async deleteComment(commentId: number): Promise<void> {
        const where = {
            id: commentId,
            deletedAt: null,
        };
        const data = {
            deletedAt: new Date(),
        }
        try {
            await this.prismaService.comment.update({
                where,
                data
            });
        } catch(err) {
            this.logger.error(err);
            throw new RepositoryBadGatewayException(err.message);
        }
    }
}