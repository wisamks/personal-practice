import { Body, Controller, HttpCode, Logger, Post, Res, UseGuards } from "@nestjs/common";
import { AuthService } from "./auth.service";
import { SignUpReqDto } from "./dto/sign-up.req.dto";
import { SignUpResDto } from "./dto/sign-up.res.dto";
import { SignInReqDto } from "./dto/sign-in.req.dto";
import { Response } from "express";
import { JwtAuthGuard } from "./auth-jwt.guard";

@Controller('auth')
export class AuthController {
    private readonly logger = new Logger('AuthController');

    constructor(private readonly authService: AuthService) {}

    @Post('/sign-in')
    @HttpCode(204)
    async signIn(
        @Body() signInReqDto: SignInReqDto,
        @Res() res: Response,
    ): Promise<Response> {
        const { accessToken } = await this.authService.signIn(signInReqDto);
        res.cookie('accessToken', accessToken, {
            httpOnly: true,
            maxAge: 3600000,
        });
        return res.end();
    }

    @Post('/sign-out')
    @HttpCode(204)
    @UseGuards(JwtAuthGuard)
    async signOut(
        @Res() res: Response,
    ): Promise<Response> {
        res.clearCookie('accessToken');
        return res.end();
    }

    @Post('/sign-up')
    @HttpCode(201)
    async signUp(
        @Body() signUpReqDto: SignUpReqDto,
    ): Promise<SignUpResDto> {
        return await this.authService.signUp(signUpReqDto);
    }
}
