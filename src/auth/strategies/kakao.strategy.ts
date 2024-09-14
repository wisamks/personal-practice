import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PassportStrategy } from "@nestjs/passport";
import { Profile, Strategy } from "passport-kakao";
import { IOauthUserOutput, ProviderType } from "../types/oauth-user.output.interface";
import { AuthServiceUnavailableException } from "@_/common/custom-error.util";

@Injectable()
export class KakaoStrategy extends PassportStrategy(Strategy, 'kakao') {
    private readonly logger = new Logger(KakaoStrategy.name);

    constructor(
        private readonly configService: ConfigService,
    ) {
        super({
            clientID: configService.get<string>('KAKAO_RESTAPI_KEY'),
            callbackURL: configService.get<string>('OAUTH_KAKAO_CALLBACK_URL'),
        })
    }

    async validate(accessToken: string, refreshToken: string, profile: Profile): Promise<IOauthUserOutput> {
        const { id, provider, username } = profile;
        const { profile_image_url, email } = profile._json.kakao_account.profile;
        if (id && username && profile_image_url && email) {
            return {
                provider: provider as ProviderType || 'kakao',
                providerId: String(id),
                name: username,
                email,
            };
        } 
        throw new AuthServiceUnavailableException();
    }
}