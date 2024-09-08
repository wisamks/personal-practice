import { Injectable, Logger, OnModuleInit } from "@nestjs/common";
import { PrismaClient } from "@prisma/client";

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
    private readonly logger = new Logger('PrismaService');

    constructor() {
        super({
            log: ['error', 'info', 'query', 'warn']
        })
    }

    onModuleInit() {
        this.$connect()
            .then(() => this.logger.log(`프리즈마 연결에 성공했습니다.`))
            .catch(err => this.logger.error(err));
    }
}