import { PrismaService } from "@_/prisma/prisma.service";
import { Injectable, Logger } from "@nestjs/common";
import { GetPostsReqDto } from "./dto/request/get-posts.req.dto";
import { Post, Prisma } from "@prisma/client";
import { ICreatePostReq } from "./types/create-post.req.interface";
import { IUpdatePostReq } from "./types/update-post.req";
import { GetCursorReqDto } from "./dto/request/get-cursor.req.dto";
import { RepositoryBadGatewayException } from "@_/common/custom-error.util";
import { IDeletePostQuery } from "./types/delete-post.query.interface";
import { IDbPost } from "./types/db-post.interface";
import { generateDatetime } from "@_/common/generate-datetime.util";

@Injectable()
export class PostRepository {
    private readonly logger = new Logger(PostRepository.name);

    constructor(
        private readonly prismaService: PrismaService,
    ) {}

    async findPostsByCursor({ take, cursor }: GetCursorReqDto): Promise<Post[]> {
        const where = {
            deletedAt: null,
        };
        const skip = cursor ? 1 : 0;
        const optionalCursor = cursor && {cursor: { id: cursor }};
        try {
            return await this.prismaService.post.findMany({
                where,
                orderBy: {
                    id: 'desc'
                },
                include: {
                    author: true,
                },
                take,
                skip,
                ...optionalCursor
            });
        } catch(err) {
            this.logger.error(err);
            throw new RepositoryBadGatewayException(err.message);
        }
    }

    async findPosts({ skip, take }: GetPostsReqDto): Promise<Post[]> {
        const where = {
            deletedAt: null,
        };
        try {
            return await this.prismaService.post.findMany({
                where,
                orderBy: {
                    id: 'desc'
                },
                skip: (skip - 1) * take,
                take,
                include: {
                    author: true,
                },
            });
        } catch(err) {
            this.logger.error(err);
            throw new RepositoryBadGatewayException(err.message);
        }
    }

    async findPost(postId: number): Promise<IDbPost> {
        const where = {
            id: postId,
            deletedAt: null,
        };
        try {
            return await this.prismaService.post.findUnique({
                where,
                include: {
                    author: true,
                    comments: {
                        take: 10,
                        orderBy: {
                            id: 'desc',
                        }
                    },
                    tags: {
                        include: {
                            tag: true,
                        }
                    },
                },
            });
        } catch(err) {
            this.logger.error(err);
            throw new RepositoryBadGatewayException(err.message);
        }
    }

    async createPost(tx: any, data: ICreatePostReq): Promise<Post> {
        try {
            const createPost = await tx.post.create({ data });
            return createPost;
        } catch(err) {
            this.logger.error(err);
            throw new RepositoryBadGatewayException(err.message);
        }
    }

    async updatePost(tx: Prisma.TransactionClient, { data, postId, userId }: {
        data: IUpdatePostReq;
        postId: number;
        userId: number;
    }): Promise<Prisma.BatchPayload> {
        const where = {
            id: postId,
            authorId: userId,
            deletedAt: null,
        };
        try {
            const updatedResult = await tx.post.updateMany({
                data,
                where,
            });
            return updatedResult;
        } catch(err) {
            this.logger.error(err);
            throw new RepositoryBadGatewayException(err.message);
        }
    }

    async deletePost(tx: Prisma.TransactionClient, { userId, postId }: IDeletePostQuery): Promise<Prisma.BatchPayload> {
        const where = {
            id: postId,
            authorId: userId,
            deletedAt: null,
        };
        try {
            const deletedResult = await tx.post.updateMany({
                data: {
                    deletedAt: generateDatetime(),
                },
                where,
            });
            return deletedResult;
        } catch(err) {
            this.logger.error(err);
            throw new RepositoryBadGatewayException(err.message);
        }
    }
}