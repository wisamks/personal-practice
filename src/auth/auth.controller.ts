import { Body, Controller, Get, HttpCode, HttpStatus, Logger, Post, Redirect, Res, UseGuards, UseInterceptors } from "@nestjs/common";
import { AuthService } from "./auth.service";
import { SignUpReqDto } from "./dto/request/sign-up.req.dto";
import { SignUpResDto } from "./dto/response/sign-up.res.dto";
import { SignInReqDto } from "./dto/request/sign-in.req.dto";
import { Response } from "express";
import { JwtAuthGuard } from "./guards/jwt-auth.guard";
import { AUTH_GUARD_STRATEGY, COOKIE_OPTIONS } from "./constants/auth.constants";
import { PATH_AUTH, PATH_CLIENT, PATH_ROUTES } from "@_/common/constants/common.constant";
import { ReqUser } from "@_/user/decorators/req-user.decorator";
import { RefreshAuthGuard } from "./guards/refresh-auth.guard";
import { AuthGuard } from "@nestjs/passport";
import { IOauthUserOutput } from "./types/oauth-user.output.interface";
import { SignInLogInterceptor } from "./interceptors/sign-in-log.interceptor";

@Controller(PATH_ROUTES.AUTH)
export class AuthController {
    private readonly logger = new Logger(AuthController.name);

    constructor(private readonly authService: AuthService) {}

    @Get(PATH_AUTH.KAKAO)
    @HttpCode(HttpStatus.NO_CONTENT)
    @UseGuards(AuthGuard(AUTH_GUARD_STRATEGY.KAKAO))
    async kakaoLogin() {}

    @Get(PATH_AUTH.KAKAO_CALLBACK)
    @HttpCode(HttpStatus.PERMANENT_REDIRECT)
    @UseGuards(AuthGuard(AUTH_GUARD_STRATEGY.KAKAO))
    @Redirect(PATH_CLIENT.DEV)
    async kakaoCallback(
        @ReqUser() user: IOauthUserOutput,
        @Res() res: Response,
    ) {
        const { accessToken, refreshToken } = await this.authService.oauthLogin(user);
        res.cookie(COOKIE_OPTIONS.ACCESS_TOKEN, accessToken, {
            httpOnly: true,
            maxAge: COOKIE_OPTIONS.ONE_HOUR_BY_MS,
        });
        res.cookie(COOKIE_OPTIONS.REFRESH_TOKEN, refreshToken, {
            httpOnly: true,
            maxAge: COOKIE_OPTIONS.ONE_WEEK_BY_MS,
        })
        return;
    }

    @Get(PATH_AUTH.NAVER)
    @HttpCode(HttpStatus.NO_CONTENT)
    @UseGuards(AuthGuard(AUTH_GUARD_STRATEGY.NAVER))
    async naverLogin() {}

    @Get(PATH_AUTH.NAVER_CALLBACK)
    @HttpCode(HttpStatus.PERMANENT_REDIRECT)
    @UseGuards(AuthGuard(AUTH_GUARD_STRATEGY.NAVER))
    @Redirect(PATH_CLIENT.DEV)
    async naverCallback(
        @ReqUser() user: IOauthUserOutput,
        @Res() res: Response,
    ) {
        const { accessToken, refreshToken } = await this.authService.oauthLogin(user);
        res.cookie(COOKIE_OPTIONS.ACCESS_TOKEN, accessToken, {
            httpOnly: true,
            maxAge: COOKIE_OPTIONS.ONE_HOUR_BY_MS,
        });
        res.cookie(COOKIE_OPTIONS.REFRESH_TOKEN, refreshToken, {
            httpOnly: true,
            maxAge: COOKIE_OPTIONS.ONE_WEEK_BY_MS,
        })
        return;
    }

    @Get(PATH_AUTH.GOOGLE)
    @HttpCode(HttpStatus.NO_CONTENT)
    @UseGuards(AuthGuard(AUTH_GUARD_STRATEGY.GOOGLE))
    async googleLogin() {}

    @Get(PATH_AUTH.GOOGLE_CALLBACK)
    @HttpCode(HttpStatus.PERMANENT_REDIRECT)
    @UseGuards(AuthGuard(AUTH_GUARD_STRATEGY.GOOGLE))
    @Redirect(PATH_CLIENT.DEV)
    async googleCallback(
        @ReqUser() user: IOauthUserOutput,
        @Res() res: Response,
    ) {
        const { accessToken, refreshToken } = await this.authService.oauthLogin(user);
        res.cookie(COOKIE_OPTIONS.ACCESS_TOKEN, accessToken, {
            httpOnly: true,
            maxAge: COOKIE_OPTIONS.ONE_HOUR_BY_MS,
        });
        res.cookie(COOKIE_OPTIONS.REFRESH_TOKEN, refreshToken, {
            httpOnly: true,
            maxAge: COOKIE_OPTIONS.ONE_WEEK_BY_MS,
        })
        return;
    }

    @Post(PATH_AUTH.SIGN_IN)
    @HttpCode(HttpStatus.NO_CONTENT)
    @UseInterceptors(SignInLogInterceptor)
    async signIn(
        @Body() signInReqDto: SignInReqDto,
        @Res() res: Response,
    ): Promise<Response> {
        const { accessToken, refreshToken } = await this.authService.signIn(signInReqDto);
        res.cookie(COOKIE_OPTIONS.ACCESS_TOKEN, accessToken, {
            httpOnly: true,
            maxAge: COOKIE_OPTIONS.ONE_HOUR_BY_MS,
        });
        res.cookie(COOKIE_OPTIONS.REFRESH_TOKEN, refreshToken, {
            httpOnly: true,
            maxAge: COOKIE_OPTIONS.ONE_WEEK_BY_MS,
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

        res.clearCookie(COOKIE_OPTIONS.ACCESS_TOKEN);
        res.clearCookie(COOKIE_OPTIONS.REFRESH_TOKEN);
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

        res.cookie(COOKIE_OPTIONS.ACCESS_TOKEN, accessToken, {
            httpOnly: true,
            maxAge: COOKIE_OPTIONS.ONE_HOUR_BY_MS,
        });
        return res.end();
    }
}
