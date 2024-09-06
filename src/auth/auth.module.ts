import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { UserRepository } from '../user/user.repository';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { JwtStrategy } from './jwt.strategy';
import { UserService } from '@_/user/user.service';
import { UserModule } from '@_/user/user.module';
import { ConfigService } from '@nestjs/config';
import { PrismaModule } from '@_/prisma/prisma.module';

@Module({
  imports: [
    UserModule,
    PassportModule.register({
      defaultStrategy: 'jwt',
    }),
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: async (config: ConfigService) => ({
        secret: config.get<string>('JWT_ACCESS_TOKEN_SECRET'),
        global: true,
        signOptions: {
          expiresIn: config.get<string>('JWT_ACCESS_EXPIRE'),
        },
      }),
    }),
    PrismaModule,
  ],
  controllers: [AuthController],
  providers: [AuthService, UserRepository, UserService, JwtStrategy],
  exports: [PassportModule, JwtStrategy]
})
export class AuthModule {}
