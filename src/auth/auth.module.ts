import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { UserRepository } from '../user/user.repository';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { jwtConfig } from '@_/config/secret.config';
import { JwtStrategy } from './jwt.strategy';
import { UserService } from '@_/user/user.service';
import { UserModule } from '@_/user/user.module';

@Module({
  imports: [
    UserModule,
    PassportModule.register({
      defaultStrategy: 'jwt',
    }),
    JwtModule.register({
      secret: jwtConfig.accessSecret,
      signOptions: {
        expiresIn: jwtConfig.accessExpire
      }
    })
  ],
  controllers: [AuthController],
  providers: [AuthService, UserRepository, UserService, JwtStrategy],
  exports: [PassportModule, JwtStrategy]
})
export class AuthModule {}
