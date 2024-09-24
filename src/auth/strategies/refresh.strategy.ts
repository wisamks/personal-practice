import { Injectable, Logger } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { Request } from 'express';
import { AuthService } from '../auth.service';
import { ConfigService } from '@nestjs/config';
import { AuthForbiddenException } from '@_/common/custom-error.util';

@Injectable()
export class RefreshStrategy extends PassportStrategy(Strategy, 'refresh') {
  private readonly logger = new Logger(RefreshStrategy.name);

  constructor(
    private readonly configService: ConfigService,
    private readonly authService: AuthService,
  ) {
    super({
      secretOrKey: configService.get<string>('JWT_REFRESH_TOKEN_SECRET'),
      jwtFromRequest: ExtractJwt.fromExtractors([
        (req: Request) => {
          const { refreshToken } = req.cookies;
          return refreshToken ? refreshToken : null;
        },
      ]),
      passReqToCallback: true,
    });
  }

  async validate(req: Request, payload: any) {
    const { refreshToken } = req?.cookies;
    const isRefreshOk = await this.authService.validateRefreshToken({
      userId: payload.userId,
      refreshToken,
    });
    if (!isRefreshOk) {
      throw new AuthForbiddenException();
    }
    return { userId: payload.userId };
  }
}
