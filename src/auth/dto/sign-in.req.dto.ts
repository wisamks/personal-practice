import { PickType } from "@nestjs/mapped-types";
import { CreateUserReqDto } from "./create-user.req.dto";

export class SignInReqDto extends PickType(CreateUserReqDto, ['email', 'password']) {}