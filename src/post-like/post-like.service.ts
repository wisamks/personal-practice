import { Inject, Injectable, Logger } from '@nestjs/common';
import { PostLikeRepository } from './post-like.repository';
import { ITogglePostLikeReq } from './types/toggle-post-like.req.interface';
import { Redis } from 'ioredis';
import { ONE_HOUR_BY_SECOND, REDIS_COUNT, REDIS_DEFAULT_ZERO, REDIS_LIKES, REDIS_LOG, REDIS_NEW, REDIS_OLD, REDIS_POSTS, REDIS_SET } from '@_/redis/constants/redis.constant';

@Injectable()
export class PostLikeService {
    private readonly logger = new Logger(PostLikeService.name);

    constructor(
        private readonly postLikeRepository: PostLikeRepository,
        @Inject('REDIS-CLIENT')
        private readonly redisClient: Redis,
    ) {}

    async getPostLikeCountByPostId(postId: number): Promise<number> {
        const likeCountKey = [REDIS_POSTS, postId, REDIS_LIKES, REDIS_COUNT].join(':');

        const redisLikeCount = await this.redisClient.get(likeCountKey);
        if (redisLikeCount) {
            return Number(redisLikeCount);
        }

        const likeCount = await this.postLikeRepository.getPostLikeCountByPostId(postId);
        await this.redisClient.set(likeCountKey, String(likeCount), 'EX', ONE_HOUR_BY_SECOND);
        return likeCount;
    }

    async togglePostLike({ userId, postId }: ITogglePostLikeReq): Promise<void> {
        const likeCountKey = [REDIS_POSTS, postId, REDIS_LIKES, REDIS_COUNT].join(':');
        const likeSetKey = [REDIS_POSTS, postId, REDIS_LIKES, REDIS_SET].join(':');
        const likeOldSetKey = [likeSetKey, REDIS_OLD].join(':');
        const likeNewSetKey = [likeSetKey, REDIS_NEW].join(':');
        const redisLikeOldSet = await this.redisClient.smembers(likeOldSetKey);
        if (!redisLikeOldSet) {
            const dbLikes = await this.postLikeRepository.getPostLikesByPostId(postId);
            const likeUsers = dbLikes.map(dbLike => dbLike.userId);
            likeUsers.push(REDIS_DEFAULT_ZERO);
            await this.redisClient.sadd(likeOldSetKey, likeUsers);
            const setSize = await this.redisClient.scard(likeOldSetKey);
            await this.redisClient.set(likeCountKey, setSize-1, 'EX', ONE_HOUR_BY_SECOND);
        }
        const isUserInNewSet = await this.redisClient.sismember(likeNewSetKey, userId);
        if (!isUserInNewSet) {
            await this.redisClient.sadd(likeNewSetKey, userId);
        } else {
            await this.redisClient.srem(likeNewSetKey, userId);
        }

        const isUserInOldSet = await this.redisClient.sismember(likeOldSetKey, userId);
        if(isUserInNewSet === isUserInOldSet) {
            await this.redisClient.incr(likeCountKey);
        } else {
            await this.redisClient.decr(likeCountKey);
        }
        return;
    }
}
