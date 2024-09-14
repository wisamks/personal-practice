import { Injectable, Logger, OnModuleInit } from "@nestjs/common";
import { PrismaClient } from "@prisma/client";
import { PRISMA_INIT_MESSAGE } from "./constants/prisma.constant";

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
    private readonly logger = new Logger(PrismaService.name);

    constructor() {
        super({
            log: ['error']
        })
    }

    onModuleInit() {
        this.$connect()
            .then(() => this.logger.log(PRISMA_INIT_MESSAGE))
            .catch(err => this.logger.error(err));
    }
}