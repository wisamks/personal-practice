import { Injectable, Logger } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";
import { Profile, Strategy } from "passport-google-oauth20";
import { GOOGLE_STRATEGY, OAUTH_GOOGLE_SCOPE } from "../constants/auth.constants";
import { OauthUserOutputType } from "../types/oauth-user.output";
import { ConfigService } from "@nestjs/config";

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
    private readonly logger = new Logger(GOOGLE_STRATEGY);

    constructor(
        private readonly configService: ConfigService,
    ) {
        super({
            clientID: configService.get<string>('OAUTH_GOOGLE_CLIENT_ID'),
            clientSecret: configService.get<string>('OAUTH_GOOGLE_CLIENT_PW'),
            callbackURL: configService.get<string>('OAUTH_GOOGLE_CALLBACK_URL'),
            scope: [OAUTH_GOOGLE_SCOPE.EMAIL, OAUTH_GOOGLE_SCOPE.PROFILE],
        })
    }

    async validate(accessToken: string, refreshToken: string, profile: Profile): Promise<OauthUserOutputType> {
        const { sub, name, email, picture } = profile._json;
        return {
            provider: profile.provider,
            providerId: sub,
            name,
            email,
        };
    }
}