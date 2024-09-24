import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger, ValidationPipe } from '@nestjs/common';
import * as cookieParser from 'cookie-parser';
import { PATH_API } from './common/constants/common.constant';
import { ConfigService } from '@nestjs/config';
import { AllExceptionFilter } from './common/filters/all-exception.filter';
import { WinstonLoggerService } from './logger/logger.service';
import { DebugInterceptor } from './auth/interceptors/sign-in-log.interceptor';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    bufferLogs: true,
  });
  app.useLogger(app.get(WinstonLoggerService));
  app.useGlobalFilters(new AllExceptionFilter());
  app.useGlobalInterceptors(new DebugInterceptor());
  const configService = app.get(ConfigService);

  const PORT = configService.get<number>('SERVER_PORT');
  app.enableCors({
    credentials: true,
    origin: 'http://localhost:3000',
  });
  app.use(cookieParser());
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      validateCustomDecorators: true,
    }),
  );

  app.setGlobalPrefix(PATH_API);
  await app.listen(PORT);
  Logger.log(`서버가 ${PORT}번 포트에서 시작되었습니다.`);
}
bootstrap();
