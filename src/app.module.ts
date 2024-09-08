import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { UserModule } from './user/user.module';
import { ConfigModule } from '@nestjs/config';
import { PostModule } from './post/post.module';
import { APP_GUARD } from '@nestjs/core';
import { ReqUserGuard } from './auth/guards/optional-jwt.guard';
import { CommentModule } from './comment/comment.module';
import { PostLikeModule } from './post-like/post-like.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    AuthModule,
    UserModule,
    PostModule,
    CommentModule,
    PostLikeModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: ReqUserGuard,
    }
  ],
})
export class AppModule {}
