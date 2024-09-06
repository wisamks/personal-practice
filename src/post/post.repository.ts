import { PrismaService } from "@_/prisma/prisma.service";
import { Injectable, InternalServerErrorException, Logger } from "@nestjs/common";
import { GetPostsReqDto } from "./dto/get-posts.req.dto";
import { Post, PrismaClient } from "@prisma/client";
import { CreatePostReqType } from "./constant/create-post.req.constant";
import { UpdatePostReqType } from "./constant/update-post.req.constant";

@Injectable()
export class PostRepository {
    private readonly logger = new Logger('PostRepository');

    constructor(
        private readonly prismaService: PrismaService,
    ) {}

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

    async createPost(tx: any, data: CreatePostReqType): Promise<Pick<Post, 'id'>> {
        try {
            const createdResult = await tx.post.create({ data });
            return { id: createdResult.id };
        } catch(err) {
            this.logger.error(err);
            throw new InternalServerErrorException(err.message);
        }
    }

    async updatePost(tx: any, { data, postId }: {
        data: UpdatePostReqType,
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