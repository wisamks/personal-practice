import { PrismaService } from "@_/prisma/prisma.service";
import { Injectable, InternalServerErrorException, Logger } from "@nestjs/common";
import { Tag } from "@prisma/client";
import { TAG_REPOSITORY } from "./constants/tag.constant";

@Injectable()
export class TagRepository {
    private readonly logger = new Logger(TAG_REPOSITORY);

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
            throw new InternalServerErrorException(err.message);
        }
    }

    async getTagByName(tx: any, name: string): Promise<Tag> {
        const where = {
            name,
            deletedAt: null,
        };
        try {
            return await tx.tag.findFirst({ where });
        } catch(err) {
            this.logger.error(err);
            throw new InternalServerErrorException(err.message);
        }
    }

    async createTagByName(tx: any, name: string): Promise<Tag> {
        try {
            return await tx.tag.create({ data: { name }});
        } catch(err) {
            this.logger.error(err);
            throw new InternalServerErrorException(err.message);
        }
    }
}