import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { JwtStrategy } from './strategies/jwt.strategy';
import { UserModule } from '@_/user/user.module';
import { ConfigService } from '@nestjs/config';
import { PASSPORT_MODULE_OPTION } from './constants/auth.constants';
import { RefreshAuthGuard } from './guards/auth-refresh.guard';
import { RefreshStrategy } from './strategies/refresh.strategy';

@Module({
  imports: [
    UserModule,
    PassportModule.register(PASSPORT_MODULE_OPTION),
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
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy, RefreshAuthGuard, JwtStrategy, RefreshStrategy],
  exports: [PassportModule, JwtStrategy, RefreshAuthGuard]
})
export class AuthModule {}
