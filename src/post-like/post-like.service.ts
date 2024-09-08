import { Injectable, Logger } from '@nestjs/common';
import { POST_LIKE_SERVICE } from './constants/post-like.constant';
import { PostLikeRepository } from './post-like.repository';
import { TogglePostLikeReqType } from './types/toggle-post-like.req';

@Injectable()
export class PostLikeService {
    private readonly logger = new Logger(POST_LIKE_SERVICE);

    constructor(
        private readonly postLikeRepository: PostLikeRepository,
    ) {}

    async getPostLikesCountByPostId(postId: number): Promise<number> {
        return await this.postLikeRepository.getPostLikesCountByPostId(postId);
    }

    async togglePostLike(data: TogglePostLikeReqType): Promise<void> {
        const foundLike = await this.postLikeRepository.getPostLikeByPostAndUser(data);
        if (!foundLike) {
            return await this.postLikeRepository.createPostLike(data);
        }
        return await this.postLikeRepository.deletePostLike(foundLike.id);
    }
}
