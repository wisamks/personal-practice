import { ProviderType } from "@_/auth/types/oauth-user.output.interface";

export interface IProviderOptions {
    readonly provider: ProviderType,
    readonly providerId: string,
}