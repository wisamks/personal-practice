import { PickType } from "@nestjs/mapped-types";
import { SignUpReqDto } from "./sign-up.req.dto";

export class SignInReqDto extends PickType(SignUpReqDto, ['email', 'password']) {}