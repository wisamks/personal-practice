import { Injectable, LoggerService } from '@nestjs/common';
import { winstonConfig } from './config/winston.config';

@Injectable()
export class WinstonLoggerService implements LoggerService {
  log(message: any, context?: string) {
    winstonConfig.info(this.formatMessage(message, context));
  }

  error(message: any, trace?: string, context?: string) {
    winstonConfig.error(this.formatMessage(message, context));
  }

  warn(message: any, context?: string) {
    winstonConfig.warn(this.formatMessage(message, context));
  }

  debug(message: any, context?: string) {
    winstonConfig.debug(this.formatMessage(message, context));
  }

  verbose(message: any, context?: string) {
    winstonConfig.verbose(this.formatMessage(message, context));
  }

  private formatMessage(message: any, context?: string): string {
    return context ? `[${context}] ${message}` : message;
  }
}
