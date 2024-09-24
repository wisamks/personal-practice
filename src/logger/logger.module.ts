import { Global, Module } from '@nestjs/common';
import { WinstonModule } from 'nest-winston';
import { winstonConfig } from './config/winston.config';
import { WinstonLoggerService } from './logger.service';

@Global()
@Module({
  imports: [
    WinstonModule.forRoot({
      instance: winstonConfig,
    }),
  ],
  providers: [WinstonLoggerService],
  exports: [WinstonLoggerService],
})
export class LoggerModule {}
