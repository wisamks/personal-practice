import { Module } from '@nestjs/common';
import { PostService } from './post.service';
import { PostController } from './post.controller';
import { PostRepository } from './post.repository';
import { TagService } from '@_/tag/tag.service';
import { TagRepository } from '@_/tag/tag.repository';
import { TagModule } from '@_/tag/tag.module';

@Module({
  imports: [TagModule],
  controllers: [PostController],
  providers: [PostService, PostRepository, TagService, TagRepository],
})
export class PostModule {}
