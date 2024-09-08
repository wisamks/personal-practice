import { Module } from '@nestjs/common';
import { CommentService } from './comment.service';
import { CommentController } from './comment.controller';
import { CommentRepository } from './comment.repository';
import { PrismaModule } from '@_/prisma/prisma.module';

@Module({
  imports: [
    PrismaModule,
  ],
  controllers: [CommentController],
  providers: [CommentService, CommentRepository],
})
export class CommentModule {}
