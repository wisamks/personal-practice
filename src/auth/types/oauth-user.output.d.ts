type ProviderType = 'google' | 'naver' | 'kakao' ;

export interface OauthUserOutputType {
    provider: ProviderType;
    providerId: string;
    name: string;
    email: string;
}