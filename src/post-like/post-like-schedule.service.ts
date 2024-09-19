import { Inject, Injectable, Logger } from "@nestjs/common";
import { PostLikeRepository } from "./post-like.repository";
import { Redis } from "ioredis";
import { Cron, CronExpression } from "@nestjs/schedule";
import { REDIS_ALL, REDIS_LIKES, REDIS_NEW, REDIS_OLD, REDIS_POSTS, REDIS_SET } from "@_/redis/constants/redis.constant";
import { RepositoryBadGatewayException } from "@_/common/custom-error.util";

@Injectable()
export class PostLikeScheduleService {
    private readonly logger = new Logger(PostLikeScheduleService.name);

    constructor(
        private readonly postLikeRepository: PostLikeRepository,
        @Inject('REDIS-CLIENT')
        private readonly redisClient: Redis,
    ) {}

    @Cron(CronExpression.EVERY_MINUTE)
    async processPostLikeEvent(): Promise<void> {
        const now = Date.now();
        try {
            const allOldKeys = [REDIS_POSTS, REDIS_ALL, REDIS_LIKES, REDIS_SET, REDIS_OLD].join(':');
            const likesOldKeys = await this.redisClient.keys(allOldKeys);
            let count = 0;

            const allCreateArray = [];

            for (const likesOldKey of likesOldKeys) {
                const postId = Number(likesOldKey.split(':')[1]);
                const likesNewKey = [REDIS_POSTS, postId, REDIS_LIKES, REDIS_SET, REDIS_NEW].join(':');
                
                const [createSet, deleteSet] = await Promise.all([
                    this.redisClient.sdiff(likesNewKey, likesOldKey),
                    this.redisClient.sinter(likesNewKey, likesOldKey),
                ]);
                createSet.forEach(userId => {
                    allCreateArray.push({ postId, userId: Number(userId) });
                })
                const userIds = deleteSet.map(Number);
                
                const [deletedResult] = await Promise.all([
                    this.postLikeRepository.deletePostLikes({ postId, userIds }),
                    this.redisClient.del(likesOldKey),
                    this.redisClient.del(likesNewKey),
                ]);
                count += deletedResult.count;
            }
            if (allCreateArray.length !== 0) {
                const createdResult = await this.postLikeRepository.createPostLikes(allCreateArray);
                count += createdResult.count;
            }            

            this.logger.log(`좋아요 스케쥴 성공: ${count}개 ${Date.now() - now}ms`);
            return;
        } catch(err) {
            this.logger.error(err);
            throw new RepositoryBadGatewayException(err.message);
        }
    }
}