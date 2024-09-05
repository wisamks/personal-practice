import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserModule } from './user/user.module';
import { ConfigModule } from '@nestjs/config';
import { PostModule } from './post/post.module';
import { APP_GUARD } from '@nestjs/core';
import { ReqUserGuard } from './auth/optional-jwt.guard';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    AuthModule,
    TypeOrmModule.forRoot({
      type: 'mysql',
      host: process.env.MYSQL_HOST,
      port: +process.env.MYSQL_PORT,
      username: process.env.MYSQL_USER,
      password: process.env.MYSQL_PW,
      database: process.env.MYSQL_NAME,
      entities: [__dirname + '/../**/*.entity.{js, ts}'],
      synchronize: true,
      dateStrings: false,
      timezone: 'Z',
    }),
    UserModule,
    PostModule,
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
