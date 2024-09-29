import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { UserModule } from './user/user.module';
import { ConfigModule } from '@nestjs/config';
import { PostModule } from './post/post.module';
import { CommentModule } from './comment/comment.module';
import { PostLikeModule } from './post-like/post-like.module';
import { PrismaModule } from './prisma/prisma.module';
import { RedisModule } from './redis/redis.module';
import { ScheduleModule } from '@nestjs/schedule';
import { LoggerModule } from './logger/logger.module';
import awsConfig from './config/aws.config';
import { APP_FILTER, APP_INTERCEPTOR } from '@nestjs/core';
import { AllExceptionFilter } from './common/filters/all-exception.filter';
import { DebugInterceptor } from './auth/interceptors/sign-in-log.interceptor';
import { S3FileModule } from './s3-file/s3-file.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [awsConfig],
    }),
    ScheduleModule.forRoot(),
    AuthModule,
    UserModule,
    PostModule,
    CommentModule,
    PostLikeModule,
    PrismaModule,
    RedisModule,
    LoggerModule,
    S3FileModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_FILTER,
      useClass: AllExceptionFilter,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: DebugInterceptor,
    },
  ],
})
export class AppModule {}
