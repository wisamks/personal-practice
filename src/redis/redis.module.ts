import { Global, Module } from "@nestjs/common";
import { Redis } from "ioredis";

@Global()
@Module({
    providers: [
        {
            provide: 'REDIS-CLIENT',
            useFactory: () => {
                const redis = new Redis({
                    host: process.env.REDIS_HOST,
                    port: +process.env.REDIS_PORT,
                });
                return redis;
            }
        }
    ],
    exports: ['REDIS-CLIENT'],
})
export class RedisModule {}