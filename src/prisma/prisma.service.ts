import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from "@nestjs/common";
import { PrismaClient } from "@prisma/client";
import { PRISMA_DESTROY_MESSAGE, PRISMA_INIT_MESSAGE } from "./constants/prisma.constant";
import { RepositoryServiceUnavailableException } from "@_/common/custom-error.util";

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
    private readonly logger = new Logger(PrismaService.name);

    constructor() {
        super({
            log: ['error']
        })
    }

    onModuleInit() {
        this.$connect()
            .then(() => this.logger.log(PRISMA_INIT_MESSAGE))
            .catch(err => {
                this.logger.error(err);
                throw new RepositoryServiceUnavailableException(err.message);
            });
    }

    onModuleDestroy() {
        this.$disconnect()
            .then(() => this.logger.log(PRISMA_DESTROY_MESSAGE))
            .catch(err => {
                this.logger.error(err);
                throw new RepositoryServiceUnavailableException(err.message);
            })
    }
}