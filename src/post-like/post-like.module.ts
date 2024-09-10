import { Module } from '@nestjs/common';
import { PostLikeService } from './post-like.service';
import { PostLikeController } from './post-like.controller';
import { PostLikeRepository } from './post-like.repository';
import { PostLikeScheduleService } from './post-like-schedule.service';

@Module({
  controllers: [PostLikeController],
  providers: [PostLikeService, PostLikeRepository, PostLikeScheduleService],
  exports: [PostLikeService, PostLikeRepository, PostLikeScheduleService]
})
export class PostLikeModule {}
