import { PrismaService } from "@_/prisma/prisma.service";
import { Injectable, Logger } from "@nestjs/common";
import { COMMENT_REPOSITORY } from "./constants/comment.constant";

@Injectable()
export class CommentRepository {
    private readonly logger = new Logger(COMMENT_REPOSITORY);

    constructor(
        private readonly prismaService: PrismaService,
    ) {}

    async createComment() {}
}