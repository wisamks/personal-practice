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

    async createView(data: CreateViewInputType): Promise<void> {
        try {
            await this.prismaService.view.create({ data });
            return;
        } catch(err) {
            this.logger.error(err);
            throw new InternalServerErrorException(err.message);
        }
    };
}