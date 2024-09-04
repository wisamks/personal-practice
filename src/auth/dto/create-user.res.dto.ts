import { Exclude, Expose } from "class-transformer";

export class CreateUserResDto {
    @Expose({ name: 'id' })
    readonly userId: number;

    @Exclude()
    readonly email: string;
    
    @Exclude()
    readonly password: string;
    
    @Exclude()
    readonly name: string;
    
    @Exclude()
    readonly createdAt: Date;
    
    @Exclude()
    readonly updatedAt: Date;
    
    @Exclude()
    readonly deletedAt: Date;
}