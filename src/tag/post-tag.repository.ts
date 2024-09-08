import { PrismaService } from "@_/prisma/prisma.service";
import { Injectable, InternalServerErrorException, Logger } from "@nestjs/common";
import { PostTag } from "@prisma/client";
import { POST_TAG_REPOSITORY } from "./constants/tag.constant";

@Injectable()
export class PostTagRepository {
    private readonly logger = new Logger(POST_TAG_REPOSITORY);
    
    constructor(
        private readonly prismaService: PrismaService,
    ) {}

    async getRelationsByPostId(postId: number): Promise<PostTag[]> {
        const foundRelations = await this.prismaService.postTag.findMany({
            where: { postId }
        });
        return foundRelations;
    }

    async createRelations(tx: any, data: PostTag[]): Promise<void> {
        try {
            await tx.postTag.createMany({ data });
            return;
        } catch(err) {
            this.logger.error(err);
            throw new InternalServerErrorException(err.message);
        }
    }

    async deleteRelationsByPostId(tx: any, postId: number): Promise<void> {  
        const where = {
            postId
        };
        try {
            await tx.postTag.deleteMany({ where });
            return;
        } catch(err) {
            this.logger.error(err);
            throw new InternalServerErrorException(err.message);
        }
    }
}