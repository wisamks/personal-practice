import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PassportStrategy } from "@nestjs/passport";
import { Profile, Strategy } from "passport-kakao";
import { OauthUserOutputType, ProviderType } from "../types/oauth-user.output";
import { KAKAO_STRATEGY } from "../constants/auth.constants";

@Injectable()
export class KakaoStrategy extends PassportStrategy(Strategy, 'kakao') {
    private readonly logger = new Logger(KAKAO_STRATEGY);

    constructor(
        private readonly configService: ConfigService,
    ) {
        super({
            clientID: configService.get<string>('KAKAO_RESTAPI_KEY'),
            callbackURL: configService.get<string>('OAUTH_KAKAO_CALLBACK_URL'),
        })
    }

    async validate(accessToken: string, refreshToken: string, profile: Profile): Promise<OauthUserOutputType> {
        const { id, provider, username } = profile;
        const { profile_image_url, email } = profile._json.kakao_account.profile;
        return {
            provider: provider as ProviderType,
            providerId: String(id),
            name: username,
            email,
        };
    }
}