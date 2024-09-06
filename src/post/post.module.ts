import { Module } from '@nestjs/common';
import { PostService } from './post.service';
import { PostController } from './post.controller';
import { PostRepository } from './post.repository';
import { TagService } from '@_/tag/tag.service';
import { TagRepository } from '@_/tag/tag.repository';
import { TagModule } from '@_/tag/tag.module';
import { PostTagRepository } from '@_/tag/post-tag.repository';
import { PrismaModule } from '@_/prisma/prisma.module';

@Module({
  imports: [
    TagModule,
    PrismaModule,
  ],
  controllers: [PostController],
  providers: [PostService, PostRepository, TagService, TagRepository, PostTagRepository],
  exports: [PostService, PostRepository]
})
export class PostModule {}
