import { Module } from '@nestjs/common';
import { PostService } from './post.service';
import { PostController } from './post.controller';
import { PostRepository } from './post.repository';
import { TagService } from '@_/tag/tag.service';
import { TagRepository } from '@_/tag/tag.repository';
import { TagModule } from '@_/tag/tag.module';
import { PostTagRepository } from '@_/tag/post-tag.repository';
import { PrismaModule } from '@_/prisma/prisma.module';
import { CommentModule } from '@_/comment/comment.module';
import { CommentService } from '@_/comment/comment.service';
import { CommentRepository } from '@_/comment/comment.repository';
import { ViewModule } from '@_/view/view.module';
import { ViewService } from '@_/view/view.service';
import { ViewRepository } from '@_/view/view.repository';

@Module({
  imports: [
    TagModule,
    PrismaModule,
    CommentModule,
    ViewModule,
  ],
  controllers: [PostController],
  providers: [
    PostService, 
    PostRepository, 
    TagService, 
    TagRepository, 
    PostTagRepository, 
    CommentService,
    CommentRepository,
    ViewService,
    ViewRepository,
  ],
  exports: [PostService, PostRepository]
})
export class PostModule {}
