import { PrismaService } from "@_/prisma/prisma.service";
import { Injectable, Logger } from "@nestjs/common";
import { ICreateViewInput } from "./types/create-view.input.interface";
import { RepositoryBadGatewayException } from "@_/common/custom-error.util";

@Injectable()
export class ViewRepository {
    private readonly logger = new Logger(ViewRepository.name);

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
            throw new RepositoryBadGatewayException(err.message);
        }
    }

    async createView(data: ICreateViewInput): Promise<void> {
        try {
            await this.prismaService.view.create({ data });
            return;
        } catch(err) {
            this.logger.error(err);
            throw new RepositoryBadGatewayException(err.message);
        }
    };

    async createViews(data: ICreateViewInput[]): Promise<void> {
        try {
            await this.prismaService.view.createMany({ data });
        } catch(err) {
            this.logger.error(err);
            throw new RepositoryBadGatewayException(err.message);
        }
    }
}