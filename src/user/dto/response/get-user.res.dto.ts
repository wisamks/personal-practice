import { ProviderType } from "@_/auth/types/oauth-user.output.interface";
import { Exclude, Expose } from "class-transformer";

export class GetUserResDto {
    @Expose({ name: 'id' })
    readonly userId: number;

    readonly email: string;
    
    @Exclude()
    readonly password: string;
    
    readonly name: string;

    @Exclude()
    readonly provider: ProviderType;

    @Exclude()
    readonly providerId: string;

    @Exclude()
    readonly refreshToken: string;
    
    @Exclude()
    readonly createdAt: Date;
    
    @Exclude()
    readonly updatedAt: Date;
    
    @Exclude()
    readonly deletedAt: Date;
}