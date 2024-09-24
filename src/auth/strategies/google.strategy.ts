import { Injectable, Logger } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Profile, Strategy } from 'passport-google-oauth20';
import { OAUTH_GOOGLE_SCOPE } from '../constants/auth.constants';
import { IOauthUserOutput } from '../types/oauth-user.output.interface';
import { ConfigService } from '@nestjs/config';
import { AuthServiceUnavailableException } from '@_/common/custom-error.util';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  private readonly logger = new Logger(GoogleStrategy.name);

  constructor(private readonly configService: ConfigService) {
    super({
      clientID: configService.get<string>('OAUTH_GOOGLE_CLIENT_ID'),
      clientSecret: configService.get<string>('OAUTH_GOOGLE_CLIENT_PW'),
      callbackURL: configService.get<string>('OAUTH_GOOGLE_CALLBACK_URL'),
      scope: [OAUTH_GOOGLE_SCOPE.EMAIL, OAUTH_GOOGLE_SCOPE.PROFILE],
    });
  }

  async validate(accessToken: string, refreshToken: string, profile: Profile): Promise<IOauthUserOutput> {
    const { sub, name, email, picture } = profile._json;
    if (sub && name && email && picture) {
      return {
        provider: profile.provider,
        providerId: sub,
        name,
        email,
      };
    }
    throw new AuthServiceUnavailableException();
  }
}
