import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger, ValidationPipe } from '@nestjs/common';
import * as cookieParser from 'cookie-parser';
import * as session from 'express-session';
import { ONE_HOUR_BY_SECOND } from './redis/constants/redis.constant';
import * as passport from 'passport';
import RedisStore from 'connect-redis';
import { PATH_API } from './common/common.constant';

async function bootstrap() {
  const PORT = process.env.SERVER_PORT;

  const app = await NestFactory.create(AppModule);
  app.enableCors();
  app.use(cookieParser());
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    transform: true,
    validateCustomDecorators: true,
  }));
  app.setGlobalPrefix(PATH_API);
  const redisClient = app.get('REDIS-CLIENT');

  const redisStore = new RedisStore({
    client: redisClient,
    ttl: ONE_HOUR_BY_SECOND,
  });
  
  app.use(session({
    store: redisStore,
    secret: process.env.JWT_ACCESS_TOKEN_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: { 
      httpOnly: true,  
      maxAge: ONE_HOUR_BY_SECOND * 1000 
    }
  }))
  app.use(passport.initialize());
  app.use(passport.session());

  await app.listen(PORT);
  Logger.log(`서버가 ${PORT}번 포트에서 시작되었습니다.`);
}
bootstrap();
