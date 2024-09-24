import { Global, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Redis } from 'ioredis';

@Global()
@Module({
  providers: [
    {
      inject: [ConfigService],
      provide: 'REDIS-CLIENT',
      useFactory: async (configService: ConfigService) =>
        new Redis({
          host: configService.get<string>('REDIS_HOST'),
          port: configService.get<number>('REDIS_PORT'),
        }),
    },
  ],
  exports: ['REDIS-CLIENT'],
})
export class RedisModule {}
