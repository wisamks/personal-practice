import { Module } from '@nestjs/common';
import { PostLikeService } from './post-like.service';
import { PostLikeController } from './post-like.controller';
import { PostLikeRepository } from './post-like.repository';
import { PrismaModule } from '@_/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [PostLikeController],
  providers: [PostLikeService, PostLikeRepository],
})
export class PostLikeModule {}
