import { ProviderType } from "@_/auth/types/oauth-user.output";

export interface ProviderOptionsType {
    readonly provider: ProviderType,
    readonly providerId: string,
}