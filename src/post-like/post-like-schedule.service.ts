import { Inject, Injectable, InternalServerErrorException, Logger } from "@nestjs/common";
import { POST_LIKE_SCHEDULE_SERVICE } from "./constants/post-like.constant";
import { PostLikeRepository } from "./post-like.repository";
import { Redis } from "ioredis";
import { Cron, CronExpression } from "@nestjs/schedule";
import { REDIS_ALL, REDIS_LIKES, REDIS_NEW, REDIS_OLD, REDIS_POSTS, REDIS_SET } from "@_/redis/constants/redis.constant";

@Injectable()
export class PostLikeScheduleService {
    private readonly logger = new Logger(POST_LIKE_SCHEDULE_SERVICE);

    constructor(
        private readonly postLikeRepository: PostLikeRepository,
        @Inject('REDIS-CLIENT')
        private readonly redisClient: Redis,
    ) {}

    @Cron(CronExpression.EVERY_MINUTE)
    async processPostLikeEvent(): Promise<void> {
        this.logger.verbose('좋아요 스케쥴 시작');
        try {
            const allOldKeys = [REDIS_POSTS, REDIS_ALL, REDIS_LIKES, REDIS_SET, REDIS_OLD].join(':');
            const likesOldKeys = await this.redisClient.keys(allOldKeys);

            for (const likesOldKey of likesOldKeys) {
                const postId = Number(likesOldKey.split(':')[1]);
                const likesNewKey = [REDIS_POSTS, postId, REDIS_LIKES, REDIS_SET, REDIS_NEW].join(':');
                const createSet = await this.redisClient.sdiff(likesNewKey, likesOldKey);
                const createArray = createSet.map(userId => ({ postId, userId: Number(userId) }));
                const deleteSet = await this.redisClient.sinter(likesNewKey, likesOldKey);
                const deleteArray = deleteSet.map(userId => ({ postId, userId: Number(userId) }));
                for (const deleteItem of deleteArray) {
                    await this.postLikeRepository.deletePostLikes(deleteItem);
                }
                await Promise.all([
                    this.postLikeRepository.createPostLikes(createArray),
                    this.redisClient.del(likesOldKey),
                    this.redisClient.del(likesNewKey),
                ]);
            }
        } catch(err) {
            this.logger.error(err);
            throw new InternalServerErrorException(err.message);
        }
    }
}