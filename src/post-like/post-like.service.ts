import { Inject, Injectable, Logger } from '@nestjs/common';
import { POST_LIKE_SERVICE } from './constants/post-like.constant';
import { PostLikeRepository } from './post-like.repository';
import { TogglePostLikeReqType } from './types/toggle-post-like.req';
import { Redis } from 'ioredis';
import { ONE_HOUR_BY_SECOND, REDIS_COUNT, REDIS_LIKES, REDIS_POSTS } from '@_/redis/constants/redis.constant';

@Injectable()
export class PostLikeService {
    private readonly logger = new Logger(POST_LIKE_SERVICE);

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

    async togglePostLike(data: TogglePostLikeReqType): Promise<void> {
        const likesCountKey = [REDIS_POSTS, data.postId, REDIS_LIKES, REDIS_COUNT].join(':');
        
        const foundLike = await this.postLikeRepository.getPostLikeByPostAndUser(data);
        const redisLikesCount = await this.redisClient.get(likesCountKey);

        if (!foundLike) {
            if (redisLikesCount) {
                await this.redisClient.incr(likesCountKey);
            }
            return await this.postLikeRepository.createPostLike(data);
        }
        if (redisLikesCount) {
            await this.redisClient.decr(likesCountKey);
        }
        return await this.postLikeRepository.deletePostLike(foundLike.id);
    }
}
