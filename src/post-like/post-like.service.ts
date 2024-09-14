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

    async getPostLikesCountByPostId(postId: number): Promise<number> {
        const likesCountKey = [REDIS_POSTS, postId, REDIS_LIKES, REDIS_COUNT].join(':');

        const redisLikesCount = await this.redisClient.get(likesCountKey);
        if (redisLikesCount) {
            return Number(redisLikesCount);
        }

        const likesCount = await this.postLikeRepository.getPostLikesCountByPostId(postId);
        await this.redisClient.set(likesCountKey, String(likesCount), 'EX', ONE_HOUR_BY_SECOND);
        return likesCount;
    }

    async togglePostLike({ userId, postId }: ITogglePostLikeReq): Promise<void> {
        const likesCountKey = [REDIS_POSTS, postId, REDIS_LIKES, REDIS_COUNT].join(':');
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
            await this.redisClient.set(likesCountKey, setSize-1, 'EX', ONE_HOUR_BY_SECOND);
        }
        const isUserInNewSet = await this.redisClient.sismember(likeNewSetKey, userId);
        if (!isUserInNewSet) {
            await this.redisClient.sadd(likeNewSetKey, userId);
        } else {
            await this.redisClient.srem(likeNewSetKey, userId);
        }

        const isUserInOldSet = await this.redisClient.sismember(likeOldSetKey, userId);
        if(isUserInNewSet === isUserInOldSet) {
            await this.redisClient.incr(likesCountKey);
        } else {
            await this.redisClient.decr(likesCountKey);
        }
        return;
    }
}
