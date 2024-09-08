import { Module } from '@nestjs/common';
import { PostLikeService } from './post-like.service';
import { PostLikeController } from './post-like.controller';
import { PostLikeRepository } from './post-like.repository';

@Module({
  controllers: [PostLikeController],
  providers: [PostLikeService, PostLikeRepository],
  exports: [PostLikeService, PostLikeRepository]
})
export class PostLikeModule {}
