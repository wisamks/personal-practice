import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PassportStrategy } from "@nestjs/passport";
import { OauthUserOutputType, ProviderType } from "../types/oauth-user.output";
import { NAVER_STRATEGY } from "../constants/auth.constants";
import { Profile, Strategy } from "passport-naver-v2";

@Injectable()
export class NaverStrategy extends PassportStrategy(Strategy, 'naver') {
    private readonly logger = new Logger(NAVER_STRATEGY);

    constructor(
        private readonly configService: ConfigService,
    ) {
        super({
            clientID: configService.get<string>('OAUTH_NAVER_CLIENT_ID'),
            clientSecret: configService.get<string>('OAUTH_NAVER_CLIENT_PW'),
            callbackURL: configService.get<string>('OAUTH_NAVER_CALLBACK_URL'),
        })
    }

    async validate(accessToken: string, refreshToken: string, profile: Profile): Promise<OauthUserOutputType> {
        const { id, email, profileImage, name } = profile;
        return {
            provider: profile.provider as ProviderType,
            providerId: id,
            email,
            name,
        }
    }
}