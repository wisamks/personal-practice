import { Exclude, Expose } from "class-transformer";

export class GetUserResDto {
    @Expose({ name: 'id' })
    readonly userId: number;

    readonly email: string;
    
    @Exclude()
    readonly password: string;
    
    readonly name: string;
    
    readonly createdAt: Date;
    
    readonly updatedAt: Date;
    
    @Exclude()
    readonly deletedAt: Date;
}