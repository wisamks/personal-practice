import { Body, Controller, Get, HttpCode, HttpStatus, Logger, Post, Redirect, Res, UseGuards } from "@nestjs/common";
import { AuthService } from "./auth.service";
import { SignUpReqDto } from "./dto/request/sign-up.req.dto";
import { SignUpResDto } from "./dto/response/sign-up.res.dto";
import { SignInReqDto } from "./dto/request/sign-in.req.dto";
import { Response } from "express";
import { JwtAuthGuard } from "./guards/auth-jwt.guard";
import { AUTH_CONTROLLER, COOKIE_ACCESS_TOKEN_NAME, COOKIE_REFRESH_TOKEN_NAME, ONE_HOUR_BY_MS, ONE_WEEK_BY_MS } from "./constants/auth.constants";
import { PATH_AUTH, PATH_CLIENT, PATH_ROUTES } from "@_/common/common.constant";
import { ReqUser } from "@_/user/decorators/req-user.decorator";
import { RefreshAuthGuard } from "./guards/auth-refresh.guard";
import { AuthGuard } from "@nestjs/passport";
import { OauthUserOutputType } from "./types/oauth-user.output";

@Controller(PATH_ROUTES.AUTH)
export class AuthController {
    private readonly logger = new Logger(AUTH_CONTROLLER);

    constructor(private readonly authService: AuthService) {}

    @Get(PATH_AUTH.NAVER)
    @HttpCode(HttpStatus.NO_CONTENT)
    @UseGuards(AuthGuard('naver'))
    async naverLogin() {}

    @Get(PATH_AUTH.NAVER_CALLBACK)
    @HttpCode(HttpStatus.PERMANENT_REDIRECT)
    @UseGuards(AuthGuard('naver'))
    @Redirect(PATH_CLIENT.DEV)
    async naverCallback(
        @ReqUser() user: OauthUserOutputType,
        @Res() res: Response,
    ) {
        const { accessToken, refreshToken } = await this.authService.oauthLogin(user);
        res.cookie(COOKIE_ACCESS_TOKEN_NAME, accessToken, {
            httpOnly: true,
            maxAge: ONE_HOUR_BY_MS,
        });
        res.cookie(COOKIE_REFRESH_TOKEN_NAME, refreshToken, {
            httpOnly: true,
            maxAge: ONE_WEEK_BY_MS,
        })
        return;
    }

    @Get(PATH_AUTH.GOOGLE)
    @HttpCode(HttpStatus.NO_CONTENT)
    @UseGuards(AuthGuard('google'))
    async googleLogin() {}

    @Get(PATH_AUTH.GOOGLE_CALLBACK)
    @HttpCode(HttpStatus.PERMANENT_REDIRECT)
    @UseGuards(AuthGuard('google'))
    @Redirect(PATH_CLIENT.DEV)
    async googleCallback(
        @ReqUser() user: OauthUserOutputType,
        @Res() res: Response,
    ) {
        const { accessToken, refreshToken } = await this.authService.oauthLogin(user);
        res.cookie(COOKIE_ACCESS_TOKEN_NAME, accessToken, {
            httpOnly: true,
            maxAge: ONE_HOUR_BY_MS,
        });
        res.cookie(COOKIE_REFRESH_TOKEN_NAME, refreshToken, {
            httpOnly: true,
            maxAge: ONE_WEEK_BY_MS,
        })
        return;
    }

    @Post(PATH_AUTH.SIGN_IN)
    @HttpCode(HttpStatus.NO_CONTENT)
    async signIn(
        @Body() signInReqDto: SignInReqDto,
        @Res() res: Response,
    ): Promise<Response> {
        const { accessToken, refreshToken } = await this.authService.signIn(signInReqDto);
        res.cookie(COOKIE_ACCESS_TOKEN_NAME, accessToken, {
            httpOnly: true,
            maxAge: ONE_HOUR_BY_MS,
        });
        res.cookie(COOKIE_REFRESH_TOKEN_NAME, refreshToken, {
            httpOnly: true,
            maxAge: ONE_WEEK_BY_MS,
        })
        return res.end();
    }

    @Post(PATH_AUTH.SIGN_OUT)
    @HttpCode(HttpStatus.NO_CONTENT)
    @UseGuards(JwtAuthGuard)
    async signOut(
        @Res() res: Response,
        @ReqUser('userId') userId: number,
    ): Promise<Response> {
        await this.authService.signOut(userId);

        res.clearCookie(COOKIE_ACCESS_TOKEN_NAME);
        res.clearCookie(COOKIE_REFRESH_TOKEN_NAME);
        return res.end();
    }

    @Post(PATH_AUTH.SIGN_UP)
    @HttpCode(HttpStatus.CREATED)
    async signUp(
        @Body() signUpReqDto: SignUpReqDto,
    ): Promise<SignUpResDto> {
        return await this.authService.signUp(signUpReqDto);
    }

    @Post(PATH_AUTH.REFRESH)
    @HttpCode(HttpStatus.NO_CONTENT)
    @UseGuards(RefreshAuthGuard)
    async getAccessFromRefresh(
        @Res() res: Response,
        @ReqUser('userId') userId: number,
    ): Promise<Response> {
        const accessToken = await this.authService.getAccessToken(userId);

        res.cookie(COOKIE_ACCESS_TOKEN_NAME, accessToken, {
            httpOnly: true,
            maxAge: ONE_HOUR_BY_MS,
        });
        return res.end();
    }
}
