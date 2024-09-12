import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger, ValidationPipe } from '@nestjs/common';
import * as cookieParser from 'cookie-parser';
import { PATH_API } from './common/common.constant';

async function bootstrap() {
  const PORT = process.env.SERVER_PORT;

  const app = await NestFactory.create(AppModule);
  app.use(cookieParser());
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    transform: true,
    validateCustomDecorators: true,
  }));

  app.setGlobalPrefix(PATH_API);
  await app.listen(PORT);
  Logger.log(`서버가 ${PORT}번 포트에서 시작되었습니다.`);
}
bootstrap();
