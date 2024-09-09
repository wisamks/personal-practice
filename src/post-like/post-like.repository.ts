import { PrismaService } from "@_/prisma/prisma.service";
import { Injectable, InternalServerErrorException, Logger } from "@nestjs/common";
import { POST_LIKE_REPOSITORY } from "./constants/post-like.constant";
import { TogglePostLikeReqType } from "./types/toggle-post-like.req";
import { INTERNAL_SERVER_ERROR_MESSAGE } from "@_/common/common.constant";
import { PostLike } from "@prisma/client";

@Injectable()
export class PostLikeRepository {
    private readonly logger = new Logger(POST_LIKE_REPOSITORY);

    constructor(
        private readonly prismaService: PrismaService,
    ) {}

    async getPostLikesCountByPostId(postId: number): Promise<number> {
        const where = {
            postId,
            deletedAt: null,
        };
        try {
            return await this.prismaService.postLike.count({ where });
        } catch(err) {
            this.logger.error(err);
            throw new InternalServerErrorException(INTERNAL_SERVER_ERROR_MESSAGE);
        }
    }

    async getPostLikeByPostAndUser(data: TogglePostLikeReqType): Promise<PostLike> {
        const where = {
            ...data,
            deletedAt: null,
        };
        try {
            return await this.prismaService.postLike.findFirst({ where });
        } catch(err) {
            this.logger.error(err);
            throw new InternalServerErrorException(INTERNAL_SERVER_ERROR_MESSAGE);
        }
    }

    async createPostLike(data: TogglePostLikeReqType): Promise<void> {
        try {
            await this.prismaService.postLike.create({ data });
            return;
        } catch(err) {
            this.logger.error(err);
            throw new InternalServerErrorException(INTERNAL_SERVER_ERROR_MESSAGE);
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
            throw new InternalServerErrorException(INTERNAL_SERVER_ERROR_MESSAGE);
        }
    }
}