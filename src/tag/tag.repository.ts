import { RepositoryBadGatewayException } from "@_/common/custom-error.util";
import { PrismaService } from "@_/prisma/prisma.service";
import { Injectable, Logger } from "@nestjs/common";
import { Prisma, Tag } from "@prisma/client";

@Injectable()
export class TagRepository {
    private readonly logger = new Logger(TagRepository.name);

    constructor(
        private readonly prismaService: PrismaService,
    ) {}

    async getTag(id: number): Promise<Tag> {
        const where = {
            id,
            deletedAt: null,
        };
        try {
            return this.prismaService.tag.findUnique({ where });
        } catch(err) {
            this.logger.error(err);
            throw new RepositoryBadGatewayException(err.message);
        }
    }

    async getTagByName(tx: Prisma.TransactionClient, name: string): Promise<Tag> {
        const where = {
            name,
            deletedAt: null,
        };
        try {
            return await tx.tag.findFirst({ where });
        } catch(err) {
            this.logger.error(err);
            throw new RepositoryBadGatewayException(err.message);
        }
    }

    async createTagByName(tx: Prisma.TransactionClient, name: string): Promise<Tag> {
        try {
            return await tx.tag.create({ data: { name }});
        } catch(err) {
            this.logger.error(err);
            throw new RepositoryBadGatewayException(err.message);
        }
    }
}