import { Inject, Injectable, Logger } from "@nestjs/common";
import { ViewRepository } from "./view.repository";
import { VIEW_SERVICE } from "./constants/view.constant";
import { CreateViewInputType } from "./types/create-view.input";
import { Redis } from "ioredis";
import { ONE_HOUR_BY_SECOND, REDIS_COUNT, REDIS_LOG, REDIS_POSTS, REDIS_VIEWS } from "@_/redis/constants/redis.constant";

@Injectable()
export class ViewService {
    private readonly logger = new Logger(VIEW_SERVICE);

    constructor(
        private readonly viewRepository: ViewRepository,
        @Inject('REDIS-CLIENT')
        private readonly redisClient: Redis,
    ) {}

    async getViewCountByPostId(postId: number): Promise<number> {
        const viewsCountKey = [REDIS_POSTS, postId, REDIS_VIEWS, REDIS_COUNT].join(':');

        const redisViewsCount = await this.redisClient.get(viewsCountKey);
        if (redisViewsCount) {
            return Number(redisViewsCount);
        }

        const foundViewsCount = await this.viewRepository.getViewCountByPostId(postId);
        await this.redisClient.set(viewsCountKey, String(foundViewsCount), 'EX', ONE_HOUR_BY_SECOND);
        return foundViewsCount;
    }
 
    async createView(data: CreateViewInputType): Promise<void> {
        const viewsCountKey = [REDIS_POSTS, data.postId, REDIS_VIEWS, REDIS_COUNT].join(':');
        const viewsLogKey = [REDIS_POSTS, data.postId, REDIS_VIEWS, REDIS_LOG].join(':');

        const redisViewsCount = await this.redisClient.get(viewsCountKey);
        if (!redisViewsCount) {
            const dbViewsCount = await this.viewRepository.getViewCountByPostId(data.postId);
            await this.redisClient.set(viewsCountKey, dbViewsCount, 'EX', ONE_HOUR_BY_SECOND);
        }
        const viewLog = {
            userId: data.userId,
            createdAt: new Date(),
        };
        await this.redisClient.rpush(viewsLogKey, JSON.stringify(viewLog));
        await this.redisClient.incr(viewsCountKey);

        return;
    }
}