import { Body, Controller, HttpCode, Post } from "@nestjs/common";
import { AuthService } from "./auth.service";
import { SignUpReqDto } from "./dto/sign-up.req.dto";
import { SignUpResDto } from "./dto/sign-up.res.dto";
import { SignInReqDto } from "./dto/sign-in.req.dto";

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('/sign-in')
  @HttpCode(200)
  async signIn(
    @Body() signInReqDto: SignInReqDto,
  ) {}

  @Post('/sign-up')
  @HttpCode(201)
  async signUp(
    @Body() signUpReqDto: SignUpReqDto,
  ): Promise<SignUpResDto> {
    return await this.authService.signUp(signUpReqDto);
  }
}
