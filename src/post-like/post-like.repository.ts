import { PrismaService } from "@_/prisma/prisma.service";
import { Injectable, Logger } from "@nestjs/common";
import { ITogglePostLikeReq } from "./types/toggle-post-like.req.interface";
import { PostLike, Prisma } from "@prisma/client";
import { RepositoryBadGatewayException } from "@_/common/custom-error.util";
import { IDeletePostLikeReq } from "./types/delete-post-like.req.interface";

@Injectable()
export class PostLikeRepository {
    private readonly logger = new Logger(PostLikeRepository.name);

    constructor(
        private readonly prismaService: PrismaService,
    ) {}

    async findPostLikesByPostId(postId: number): Promise<PostLike[]> {
        const where = {
            postId,
            deletedAt: null,
        };
        try {
            return await this.prismaService.postLike.findMany({ where });
        } catch(err) {
            this.logger.error(err);
            throw new RepositoryBadGatewayException(err.message);
        }
    }

    async findPostLikeCountByPostId(postId: number): Promise<number> {
        const where = {
            postId,
            deletedAt: null,
        };
        try {
            return await this.prismaService.postLike.count({ where });
        } catch(err) {
            this.logger.error(err);
            throw new RepositoryBadGatewayException(err.message);
        }
    }

    async findPostLikeByPostAndUser(data: ITogglePostLikeReq): Promise<PostLike> {
        const where = {
            ...data,
            deletedAt: null,
        };
        try {
            return await this.prismaService.postLike.findFirst({ where });
        } catch(err) {
            this.logger.error(err);
            throw new RepositoryBadGatewayException(err.message);
        }
    }

    async createPostLike(data: ITogglePostLikeReq): Promise<PostLike> {
        try {
            const createdPostLike = await this.prismaService.postLike.create({ data });
            return createdPostLike;
        } catch(err) {
            this.logger.error(err);
            throw new RepositoryBadGatewayException(err.message);
        }
    }

    async createPostLikes(data: ITogglePostLikeReq[]): Promise<Prisma.BatchPayload> {
        try {
            const createdResult = await this.prismaService.postLike.createMany({ data });
            return createdResult;
        } catch(err) {
            this.logger.error(err);
            throw new RepositoryBadGatewayException(err.message);
        }
    }

    async deletePostLike(id: number): Promise<void> {
        const where = {
            id,
            deletedAt: null,
        };
        const data = {
            deletedAt: new Date(),
        };
        try {
            await this.prismaService.postLike.update({
                data,
                where,
            });
        } catch(err) {
            this.logger.error(err);
            throw new RepositoryBadGatewayException(err.message);
        }
    }

    async deletePostLikes({ postId, userIds }: IDeletePostLikeReq): Promise<Prisma.BatchPayload> {
        const where = {
            postId,
            userId: {
                in: userIds,
            },
            deletedAt: null,
        };
        const data = {
            deletedAt: new Date(),
        };
        try {
            const deletedResult = await this.prismaService.postLike.updateMany({
                data,
                where,
            });
            return deletedResult;
        } catch(err) {
            this.logger.error(err);
            throw new RepositoryBadGatewayException(err.message);
        }
    }
}