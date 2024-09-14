import { PrismaService } from "@_/prisma/prisma.service";
import { Injectable, Logger } from "@nestjs/common";
import { ITogglePostLikeReq } from "./types/toggle-post-like.req.interface";
import { PostLike } from "@prisma/client";
import { RepositoryBadGatewayException } from "@_/common/custom-error.util";

@Injectable()
export class PostLikeRepository {
    private readonly logger = new Logger(PostLikeRepository.name);

    constructor(
        private readonly prismaService: PrismaService,
    ) {}

    async getPostLikesByPostId(postId: number): Promise<PostLike[]> {
        const where = {
            postId,
            deletedAt: null,
        };
        try {
            return this.prismaService.postLike.findMany({ where });
        } catch(err) {
            this.logger.error(err);
            throw new RepositoryBadGatewayException(err.message);
        }
    }

    async getPostLikesCountByPostId(postId: number): Promise<number> {
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

    async getPostLikeByPostAndUser(data: ITogglePostLikeReq): Promise<PostLike> {
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

    async createPostLike(data: ITogglePostLikeReq): Promise<void> {
        try {
            await this.prismaService.postLike.create({ data });
            return;
        } catch(err) {
            this.logger.error(err);
            throw new RepositoryBadGatewayException(err.message);
        }
    }

    async createPostLikes(data: ITogglePostLikeReq[]): Promise<void> {
        try {
            await this.prismaService.postLike.createMany({ data });
            return;
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

    async deletePostLikes(ids: ITogglePostLikeReq): Promise<void> {
        const where = {
            ...ids,
            deletedAt: null,
        };
        const data = {
            deletedAt: new Date(),
        };
        try {
            await this.prismaService.postLike.updateMany({
                data,
                where,
            });
        } catch(err) {
            this.logger.error(err);
            throw new RepositoryBadGatewayException(err.message);
        }
    }
}