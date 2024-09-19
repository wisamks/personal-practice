import { Exclude } from "class-transformer";
import { GetUserResDto } from "./get-user.res.dto";

export class CreateUserResDto extends GetUserResDto {
    @Exclude()
    readonly email: string;
    
    @Exclude()
    readonly name: string;
}