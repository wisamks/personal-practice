import { RepositoryBadGatewayException } from "@_/common/custom-error.util";
import { PrismaService } from "@_/prisma/prisma.service";
import { Injectable, Logger } from "@nestjs/common";
import { PostTag } from "@prisma/client";

@Injectable()
export class PostTagRepository {
    private readonly logger = new Logger(PostTagRepository.name);
    
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
            throw new RepositoryBadGatewayException(err.message);
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
            throw new RepositoryBadGatewayException(err.message);
        }
    }
}