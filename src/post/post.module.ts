import { Module } from '@nestjs/common';
import { PostService } from './post.service';
import { PostController } from './post.controller';
import { PostRepository } from './post.repository';
import { TagModule } from '@_/tag/tag.module';
import { CommentModule } from '@_/comment/comment.module';
import { ViewModule } from '@_/view/view.module';
import { PostLikeModule } from '@_/post-like/post-like.module';

@Module({
  imports: [TagModule, CommentModule, ViewModule, PostLikeModule],
  controllers: [PostController],
  providers: [PostService, PostRepository],
  exports: [PostService, PostRepository],
})
export class PostModule {}
