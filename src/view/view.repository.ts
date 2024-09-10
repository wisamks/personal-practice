import { PrismaService } from "@_/prisma/prisma.service";
import { Injectable, InternalServerErrorException, Logger } from "@nestjs/common";
import { CreateViewInputType } from "./types/create-view.input";
import { VIEW_REPOSITORY } from "./constants/view.constant";

@Injectable()
export class ViewRepository {
    private readonly logger = new Logger(VIEW_REPOSITORY);

    constructor(
        private readonly prismaService: PrismaService,
    ) {}

    async getViewCountByPostId(postId: number): Promise<number> {
        const where = {
            postId,
            deletedAt: null,
        };
        try {
            const viewCount = await this.prismaService.view.count({ where });
            return viewCount
        } catch(err) {
            this.logger.error(err);
            throw new InternalServerErrorException(err.message);
        }
    }

    async createView(data: CreateViewInputType): Promise<void> {
        try {
            await this.prismaService.view.create({ data });
            return;
        } catch(err) {
            this.logger.error(err);
            throw new InternalServerErrorException(err.message);
        }
    };

    async createViews(data: CreateViewInputType[]): Promise<void> {
        try {
            await this.prismaService.view.createMany({ data });
        } catch(err) {
            this.logger.error(err);
            throw new InternalServerErrorException(err.message);
        }
    }
}