import { PrismaService } from "@_/prisma/prisma.service";
import { Injectable, InternalServerErrorException, Logger } from "@nestjs/common";
import { COMMENT_REPOSITORY } from "./constants/comment.constant";
import { Comment } from "@prisma/client";
import { CreateCommentInputType } from "./types/create-comment.input";
import { GetCommentsInputType } from "./types/get-comments.input";

@Injectable()
export class CommentRepository {
    private readonly logger = new Logger(COMMENT_REPOSITORY);

    constructor(
        private readonly prismaService: PrismaService,
    ) {}

    async getCommentsByPostId({ postId, take, cursor }: GetCommentsInputType): Promise<Comment[]> {
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
            throw new InternalServerErrorException(err.message);
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
            throw new InternalServerErrorException(err.message);
        }
    }

    async createComment(data: CreateCommentInputType): Promise<Pick<Comment, 'id'>> {
        try {
            const createdComment = await this.prismaService.comment.create({
                data
            });
            return { id: createdComment.id };
        } catch(err) {
            this.logger.error(err);
            throw new InternalServerErrorException(err.message);
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
            throw new InternalServerErrorException(err.message);
        }
    }
}