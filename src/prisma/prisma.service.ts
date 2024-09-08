import { Injectable, Logger, OnModuleInit } from "@nestjs/common";
import { PrismaClient } from "@prisma/client";
import { PRISMA_INIT_MESSAGE, PRISMA_SERVICE } from "./constants/prisma.constant";

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
    private readonly logger = new Logger(PRISMA_SERVICE);

    constructor() {
        super({
            log: ['error', 'info', 'query', 'warn']
        })
    }

    onModuleInit() {
        this.$connect()
            .then(() => this.logger.log(PRISMA_INIT_MESSAGE))
            .catch(err => this.logger.error(err));
    }
}