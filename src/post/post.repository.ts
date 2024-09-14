import { PrismaService } from "@_/prisma/prisma.service";
import { Injectable, InternalServerErrorException, Logger } from "@nestjs/common";
import { GetPostsReqDto } from "./dto/request/get-posts.req.dto";
import { Post } from "@prisma/client";
import { ICreatePostReq } from "./types/create-post.req.interface";
import { IUpdatePostReq } from "./types/update-post.req";
import { GetCursorReqDto } from "./dto/request/get-cursor.req.dto";

@Injectable()
export class PostRepository {
    private readonly logger = new Logger(PostRepository.name);

    constructor(
        private readonly prismaService: PrismaService,
    ) {}

    async getPostsByCursor({ take, cursor }: GetCursorReqDto): Promise<Post[]> {
        const where = {
            deletedAt: null,
        };
        try {
            return await this.prismaService.post.findMany({
                where,
                orderBy: {
                    id: 'desc'
                },
                take,
                skip: cursor ? 1 : 0,
                ...(cursor && {cursor: { id: cursor }})
            });
        } catch(err) {
            this.logger.error(err);
            throw new InternalServerErrorException(err.message);
        }
    }

    async getPosts({ skip, take }: GetPostsReqDto): Promise<Post[]> {
        const where = {
            deletedAt: null,
        };
        try {
            return await this.prismaService.post.findMany({
                where,
                orderBy: {
                    createdAt: 'desc'
                },
                skip: (skip - 1) * take,
                take,
                include: {
                    author: true,
                },
            });
        } catch(err) {
            this.logger.error(err);
            throw new InternalServerErrorException(err.message);
        }
    }

    async getPost(postId: number): Promise<Post> {
        const where = {
            id: postId,
            deletedAt: null,
        };
        try {
            return await this.prismaService.post.findFirst({
                where,
                include: {
                    author: true,
                },
            });
        } catch(err) {
            this.logger.error(err);
            throw new InternalServerErrorException(err.message);
        }
    }

    async createPost(tx: any, data: ICreatePostReq): Promise<Pick<Post, 'id'>> {
        try {
            const createdResult = await tx.post.create({ data });
            return { id: createdResult.id };
        } catch(err) {
            this.logger.error(err);
            throw new InternalServerErrorException(err.message);
        }
    }

    async updatePost(tx: any, { data, postId }: {
        data: IUpdatePostReq,
        postId: number
    }): Promise<void> {
        const where = {
            id: postId,
            deletedAt: null,
        };
        try {
            await tx.post.update({
                data,
                where,
            });
            return;
        } catch(err) {
            this.logger.error(err);
            throw new InternalServerErrorException(err.message);
        }
    }

    async deletePost(tx: any, postId: number): Promise<void> {
        const where = {
            id: postId,
            deletedAt: null,
        };
        try {
            await tx.post.update({
                data: {
                    deletedAt: new Date(),
                },
                where,
            });
        } catch(err) {
            this.logger.error(err);
            throw new InternalServerErrorException(err.message);
        }
    }
}