import { Inject, Injectable, InternalServerErrorException, Logger } from "@nestjs/common";
import { ViewRepository } from "./view.repository";
import { Redis } from "ioredis";
import { Cron, CronExpression } from "@nestjs/schedule";
import { REDIS_ALL, REDIS_LOG, REDIS_POSTS, REDIS_VIEWS } from "@_/redis/constants/redis.constant";

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
        this.logger.log('조회수 스케쥴 시작');
        try {
            const allKeys = [REDIS_POSTS, REDIS_ALL, REDIS_VIEWS, REDIS_LOG].join(':');
            const viewsLogKeys = await this.redisClient.keys(allKeys);

            for (const viewsLogKey of viewsLogKeys) {
                const postId = Number(viewsLogKey.split(':')[1]);
                const viewsLogs = [];
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
                        createdAt: new Date(createdAt),
                    });
                }

                await this.viewRepository.createViews(viewsLogs);
                return;
            }
        } catch(err) {
            this.logger.error(err);
            throw new InternalServerErrorException(err.message);
        }
    }
}