import { Body, Controller, HttpCode, HttpStatus, Logger, Post, Res, UseGuards } from "@nestjs/common";
import { AuthService } from "./auth.service";
import { SignUpReqDto } from "./dto/request/sign-up.req.dto";
import { SignUpResDto } from "./dto/response/sign-up.res.dto";
import { SignInReqDto } from "./dto/request/sign-in.req.dto";
import { Response } from "express";
import { JwtAuthGuard } from "./guards/auth-jwt.guard";
import { COOKIE_ACCESS_TOKEN_NAME } from "./constants/auth.constants";

@Controller('auth')
export class AuthController {
    private readonly logger = new Logger('AuthController');

    constructor(private readonly authService: AuthService) {}

    @Post('/sign-in')
    @HttpCode(HttpStatus.NO_CONTENT)
    async signIn(
        @Body() signInReqDto: SignInReqDto,
        @Res() res: Response,
    ): Promise<Response> {
        const { accessToken } = await this.authService.signIn(signInReqDto);
        res.cookie(COOKIE_ACCESS_TOKEN_NAME, accessToken, {
            httpOnly: true,
            maxAge: 3600000,
        });
        return res.end();
    }

    @Post('/sign-out')
    @HttpCode(HttpStatus.NO_CONTENT)
    @UseGuards(JwtAuthGuard)
    async signOut(
        @Res() res: Response,
    ): Promise<Response> {
        res.clearCookie(COOKIE_ACCESS_TOKEN_NAME);
        return res.end();
    }

    @Post('/sign-up')
    @HttpCode(HttpStatus.CREATED)
    async signUp(
        @Body() signUpReqDto: SignUpReqDto,
    ): Promise<SignUpResDto> {
        return await this.authService.signUp(signUpReqDto);
    }
}
