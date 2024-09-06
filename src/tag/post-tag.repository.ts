import { PrismaService } from "@_/prisma/prisma.service";
import { Injectable, InternalServerErrorException, Logger } from "@nestjs/common";
import { PostTag } from "@prisma/client";

@Injectable()
export class PostTagRepository {
    private readonly logger = new Logger('PostTagRepository');
    
    constructor(
        private readonly prismaService: PrismaService,
    ) {}

    async getRelationsByPostId(postId: number): Promise<PostTag[]> {
        const foundRelations = await this.prismaService.postTag.findMany({
            where: { postId }
        });
        return foundRelations;
    }

    async createRelations(data: PostTag[]): Promise<void> {
        try {
            await this.prismaService.postTag.createMany({ data });
            return;
        } catch(err) {
            this.logger.error(err);
            throw new InternalServerErrorException(err.message);
        }
    }

    async deleteRelationsByPostId(postId: number): Promise<void> {  
        const where = {
            postId
        };
        try {
            await this.prismaService.postTag.deleteMany({ where });
            return;
        } catch(err) {
            this.logger.error(err);
            throw new InternalServerErrorException(err.message);
        }
    }
}