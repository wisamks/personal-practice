import { utilities } from 'nest-winston';
import * as path from 'path';
import { createLogger, format, Logger, transports } from 'winston';
import 'winston-daily-rotate-file';

const transport = new transports.DailyRotateFile({
  level: 'info',
  dirname: path.join(process.cwd(), 'logs', 'info'),
  filename: 'practice-%DATE%.info.log',
  datePattern: 'YYYY-MM-DD',
  maxSize: '20m',
  maxFiles: '14d',
  zippedArchive: true,
});

export const winstonConfig: Logger = createLogger({
  format: format.combine(
    format.timestamp(),
    utilities.format.nestLike('Practice', {
      prettyPrint: true,
    }),
  ),
  transports: [
    new transports.Console({
      level: 'silly',
      format: format.combine(
        format.timestamp(),
        format.colorize({ message: true }),
        utilities.format.nestLike('Practice', {
          prettyPrint: true,
        }),
      ),
    }),
    transport,
    new transports.DailyRotateFile({
      level: 'warn',
      dirname: path.join(process.cwd(), 'logs', 'error'),
      filename: 'practice-%DATE%.error.log',
      datePattern: 'YYYY-MM-DD',
      maxSize: '20m',
      maxFiles: '14d',
      zippedArchive: true,
    }),
  ],
});
