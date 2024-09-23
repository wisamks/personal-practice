import { Inject, Injectable, Logger } from "@nestjs/common";
import { ViewRepository } from "./view.repository";
import { Redis } from "ioredis";
import { Cron, CronExpression } from "@nestjs/schedule";
import { REDIS_ALL, REDIS_LOG, REDIS_POSTS, REDIS_VIEWS } from "@_/redis/constants/redis.constant";
import { RepositoryBadGatewayException } from "@_/common/custom-error.util";
import { generateDatetime } from "@_/common/generate-datetime.util";

@Injectable()
export class ViewScheduleService {
    private readonly logger = new Logger(ViewScheduleService.name);

    constructor(
        private readonly viewRepository: ViewRepository,
        @Inject('REDIS-CLIENT')
        private readonly redisClient: Redis,
    ) {}

    @Cron(CronExpression.EVERY_MINUTE)
    async processViewEvents(): Promise<void> {
        const now = Date.now();
        try {
            const allKeys = [REDIS_POSTS, REDIS_ALL, REDIS_VIEWS, REDIS_LOG].join(':');
            const viewsLogKeys = await this.redisClient.keys(allKeys);
            const viewsLogs = [];
            let count = 0;

            for (const viewsLogKey of viewsLogKeys) {
                const postId = Number(viewsLogKey.split(':')[1]);
                while (true) {
                    const viewLog = await this.redisClient.lpop(viewsLogKey);
                    if (!viewLog) {
                        await this.redisClient.del(viewsLogKey);
                        break;
                    }
                    const { userId, createdAt } = JSON.parse(viewLog);
                    viewsLogs.push({
                        postId,
                        userId: Number(userId),
                        createdAt: generateDatetime(createdAt),
                    });
                }
            }
            if (viewsLogs.length !== 0) {
                const createdResult = await this.viewRepository.createViews(viewsLogs);
                count += createdResult.count;
            }
            this.logger.log(`조회수 스케쥴 작업 성공: ${count}개 ${Date.now() - now}ms`);
            return;
        } catch(err) {
            this.logger.error(err);
            throw new RepositoryBadGatewayException(err.message);
        }
    }
}