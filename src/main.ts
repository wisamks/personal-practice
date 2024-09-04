import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger, ValidationPipe } from '@nestjs/common';
import * as cookieParser from 'cookie-parser';

const PORT = 8080;

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.use(cookieParser());
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    transform: true,
    validateCustomDecorators: true,
  }));
  app.setGlobalPrefix('api');
  await app.listen(PORT);
  Logger.log(`서버가 ${PORT}번 포트에서 시작되었습니다.`);
}
bootstrap();
