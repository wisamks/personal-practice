import { Body, Controller, Get, HttpCode, HttpStatus, Logger, Post, Req, Res, UseGuards } from "@nestjs/common";
import { AuthService } from "./auth.service";
import { SignUpReqDto } from "./dto/request/sign-up.req.dto";
import { SignUpResDto } from "./dto/response/sign-up.res.dto";
import { SignInReqDto } from "./dto/request/sign-in.req.dto";
import { Request, Response } from "express";
import { JwtAuthGuard } from "./guards/auth-jwt.guard";
import { AUTH_CONTROLLER, COOKIE_ACCESS_TOKEN_NAME } from "./constants/auth.constants";
import { LogOutGuard } from "./guards/logout.guard";
import { SessionAuthGuard } from "./guards/auth-session.guard";
import { LocalAuthGuard } from "./guards/auth-local.guard";
import { ReqUser } from "@_/user/decorators/req-user.decorator";
import { PATH_AUTH, PATH_ROUTES } from "@_/common/common.constant";

@Controller(PATH_ROUTES.AUTH)
export class AuthController {
    private readonly logger = new Logger(AUTH_CONTROLLER);

    constructor(private readonly authService: AuthService) {}

    @Get(PATH_AUTH.PROFILE)
    @HttpCode(HttpStatus.OK)
    @UseGuards(SessionAuthGuard)
    async test(
        @ReqUser() reqUser,
        @Req() request: Request,
    ) {
        this.logger.verbose(JSON.stringify(request.session));
        this.logger.verbose(JSON.stringify(request.user))
        return { user: reqUser };
    }

    @Post(PATH_AUTH.LOGIN)
    @HttpCode(HttpStatus.NO_CONTENT)
    @UseGuards(LocalAuthGuard)
    async login() {}

    @Post(PATH_AUTH.LOGOUT)
    @HttpCode(HttpStatus.NO_CONTENT)
    @UseGuards(SessionAuthGuard, LogOutGuard)
    async logout(): Promise<void> {}
    

    @Post(PATH_AUTH.SIGN_IN)
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

    @Post(PATH_AUTH.SIGN_OUT)
    @HttpCode(HttpStatus.NO_CONTENT)
    @UseGuards(JwtAuthGuard)
    async signOut(
        @Res() res: Response,
    ): Promise<Response> {
        res.clearCookie(COOKIE_ACCESS_TOKEN_NAME);
        return res.end();
    }

    @Post(PATH_AUTH.SIGN_UP)
    @HttpCode(HttpStatus.CREATED)
    async signUp(
        @Body() signUpReqDto: SignUpReqDto,
    ): Promise<SignUpResDto> {
        return await this.authService.signUp(signUpReqDto);
    }
}
