import { BadRequestException, Inject, Injectable, InternalServerErrorException, Logger } from "@nestjs/common";
import { UserService } from "@_/user/user.service";
import { UserRepository } from "@_/user/user.repository";
import * as bcrypt from 'bcryptjs';
import { SignUpReqDto } from "./dto/request/sign-up.req.dto";
import { SignUpResDto } from "./dto/response/sign-up.res.dto";
import { JwtService } from "@nestjs/jwt";
import { SignInReqDto } from "./dto/request/sign-in.req.dto";
import { SIGN_IN_ERROR_MESSAGE } from "./constants/auth.constants";
import { ISignInOutput } from "./types/sign-in.output.interface";
import { IRefreshInput } from "./types/refresh.input.interface";
import { SignInResDto } from "./dto/response/sign-in.res.dto";
import { plainToInstance } from "class-transformer";
import { Redis } from "ioredis";
import { ONE_WEEK_BY_SECOND, REDIS_REFRESH_TOKEN, REDIS_USERS } from "@_/redis/constants/redis.constant";
import { IOauthUserOutput } from "./types/oauth-user.output.interface";

@Injectable()
export class AuthService {
    private readonly logger = new Logger(AuthService.name);

    constructor(
        private readonly userService: UserService,
        private readonly userRepository: UserRepository,
        private readonly jwtService: JwtService,
        @Inject('REDIS-CLIENT')
        private readonly redisClient: Redis,
    ) {}

    async validateUser(signInReqDto: SignInReqDto): Promise<ISignInOutput> {
        const foundUser = await this.userRepository.getUserByEmail(signInReqDto.email);
        if (!foundUser) {
            throw new BadRequestException(SIGN_IN_ERROR_MESSAGE);
        }
        const checkPassword = await bcrypt.compare(signInReqDto.password, foundUser.password);
        if (!checkPassword) {
            throw new BadRequestException(SIGN_IN_ERROR_MESSAGE);
        }
        return { userId: foundUser.id };
    }

    async validateRefreshToken({ userId, refreshToken }: {
        userId: number;
        refreshToken: string;
    }): Promise<boolean> {
        // REDIS에서 토큰 가져오기
        const refreshKey = [REDIS_USERS, userId, REDIS_REFRESH_TOKEN].join(':');
        const redisRefresh = await this.redisClient.get(refreshKey);

        // MYSQL에서 토큰 가져오기
        // const dbRefreshToken = await this.userService.getRefreshToken(userId);

        return await bcrypt.compare(refreshToken, redisRefresh);
    }

    async oauthLogin(user: IOauthUserOutput): Promise<SignInResDto> {
        const foundUser = await this.userService.getUserOauth({
            provider: user.provider,
            providerId: user.providerId,
        });
        if (!foundUser) {
            const createdUser = await this.userService.createUser({
                ...user,
                password: user.provider,
            });
            return this.getTokens({ userId: createdUser.userId });
        }
        return this.getTokens({ userId: foundUser.userId });
    }

    async signIn(signInReqDto: SignInReqDto): Promise<SignInResDto> {
        const payload = await this.validateUser(signInReqDto);
        
        return this.getTokens(payload);
    }

    async signOut(userId: number): Promise<void> {
        await this.userService.deleteRefresh(userId);
        return;
    }

    async signUp(signUpReqDto: SignUpReqDto): Promise<SignUpResDto> {
        return await this.userService.createUser(signUpReqDto);
    }

    async getAccessToken(userId: number): Promise<string> {
        return await this.generateToken({ userId });
    }

    // --- private ---

    private async getTokens(payload: ISignInOutput): Promise<SignInResDto> {
        const refreshOptions = {
            secret: process.env.JWT_REFRESH_TOKEN_SECRET,
            expiresIn: process.env.JWT_REFRESH_EXPIRE,
        };
        
        const [accessToken, refreshToken] = await Promise.all([
            this.generateToken(payload),
            this.generateToken(payload, refreshOptions),
        ]);
        
        const refreshKey = [REDIS_USERS, payload.userId, REDIS_REFRESH_TOKEN].join(':');

        const hashedRefreshToken = await bcrypt.hash(refreshToken, 10);
        // 레디스를 토큰 저장소로 사용하기
        await this.redisClient.set(refreshKey, hashedRefreshToken, 'EX', ONE_WEEK_BY_SECOND);
        
        // MYSQL을 토큰 저장소로 사용하기
        // await this.userService.createRefresh({ userId: payload.userId, refreshToken: hashedRefreshToken });

        return plainToInstance(SignInResDto, { accessToken, refreshToken });
    }

    private async generateToken(payload: ISignInOutput): Promise<string>;
    private async generateToken(payload: ISignInOutput, refreshOptions: IRefreshInput): Promise<string>;
    private async generateToken(payload: ISignInOutput, refreshOptions?: IRefreshInput): Promise<string> {
        try {
            if (!refreshOptions) {
                return await this.jwtService.signAsync(payload);
            }
            return await this.jwtService.signAsync(payload, refreshOptions);
        } catch(err) {
            this.logger.error(err);
            throw new InternalServerErrorException(err.message);
        }
    }
}
