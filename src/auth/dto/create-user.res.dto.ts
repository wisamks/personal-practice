import { GetUserResDto } from "./get-user.res.dto";
import { PickType } from "@nestjs/mapped-types";

export class CreateUserResDto extends PickType(GetUserResDto, ['userId']){}