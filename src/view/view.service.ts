import { Inject, Injectable, Logger } from "@nestjs/common";
import { ViewRepository } from "./view.repository";
import { ICreateViewInput } from "./types/create-view.input.interface";
import { Redis } from "ioredis";
import { ONE_HOUR_BY_SECOND, REDIS_COUNT, REDIS_LOG, REDIS_POSTS, REDIS_VIEWS } from "@_/redis/constants/redis.constant";

@Injectable()
export class ViewService {
    private readonly logger = new Logger(ViewService.name);

    constructor(
        private readonly viewRepository: ViewRepository,
        @Inject('REDIS-CLIENT')
        private readonly redisClient: Redis,
    ) {}

    async getViewCountByPostId(postId: number): Promise<number> {
        const viewCountKey = [REDIS_POSTS, postId, REDIS_VIEWS, REDIS_COUNT].join(':');

        const redisViewsCount = await this.redisClient.get(viewCountKey);
        if (redisViewsCount) {
            return Number(redisViewsCount);
        }

        const foundViewCount = await this.viewRepository.findViewCountByPostId(postId);
        await this.redisClient.set(viewCountKey, String(foundViewCount), 'EX', ONE_HOUR_BY_SECOND);
        return foundViewCount;
    }
 
    async createView({ postId, userId, createdAt }: ICreateViewInput): Promise<void> {
        const viewCountKey = [REDIS_POSTS, postId, REDIS_VIEWS, REDIS_COUNT].join(':');
        const viewsLogKey = [REDIS_POSTS, postId, REDIS_VIEWS, REDIS_LOG].join(':');

        const redisViewCount = await this.redisClient.get(viewCountKey);
        if (!redisViewCount) {
            const dbViewsCount = await this.viewRepository.findViewCountByPostId(postId);
            await this.redisClient.set(viewCountKey, dbViewsCount, 'EX', ONE_HOUR_BY_SECOND);
        }
        const viewLog = {
            userId,
            createdAt,
        };
        await this.redisClient.rpush(viewsLogKey, JSON.stringify(viewLog));
        await this.redisClient.incr(viewCountKey);

        return;
    }
}