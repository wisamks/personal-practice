export type ProviderType = 'google' | 'naver' | 'kakao' ;

export interface IOauthUserOutput {
    provider: ProviderType;
    providerId: string;
    name: string;
    email: string;
}