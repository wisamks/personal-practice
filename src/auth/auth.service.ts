import { BadRequestException, Injectable, InternalServerErrorException, Logger } from "@nestjs/common";
import { UserService } from "@_/user/user.service";
import { UserRepository } from "@_/user/user.repository";
import * as bcrypt from 'bcryptjs';
import { SignUpReqDto } from "./dto/request/sign-up.req.dto";
import { SignUpResDto } from "./dto/response/sign-up.res.dto";
import { JwtService } from "@nestjs/jwt";
import { SignInReqDto } from "./dto/request/sign-in.req.dto";
import { AUTH_SERVICE, SIGN_IN_ERROR_MESSAGE } from "./constants/auth.constants";
import { ValidateUserOutputType } from "./types/validate-user.output";

@Injectable()
export class AuthService {
    private readonly logger = new Logger(AUTH_SERVICE);

    constructor(
        private readonly userService: UserService,
        private readonly userRepository: UserRepository,
        private readonly jwtService: JwtService,
    ) {}

    async signIn(signInReqDto: SignInReqDto): Promise<{ accessToken: string }> {
        const foundUser = await this.userRepository.getUserByEmail(signInReqDto.email);
        if (!foundUser) {
            throw new BadRequestException(SIGN_IN_ERROR_MESSAGE);
        }
        const checkPassword = await bcrypt.compare(signInReqDto.password, foundUser.password);
        if (!checkPassword) {
            throw new BadRequestException(SIGN_IN_ERROR_MESSAGE);
        }
        const payload = { userId: foundUser.id };
        try {
            const accessToken = await this.jwtService.signAsync(payload);
            return { accessToken };
        } catch(err) {
            this.logger.error(err);
            throw new InternalServerErrorException(err.message);
        }
    }

    async validateUser(signInReqDto: SignInReqDto): Promise<ValidateUserOutputType> {
        const foundUser = await this.userRepository.getUserByEmail(signInReqDto.email);
        const checkPassword = await bcrypt.compare(signInReqDto.password, foundUser?.password);
        if (!foundUser || !checkPassword) {
            throw new BadRequestException(SIGN_IN_ERROR_MESSAGE);
        }

        return { userId: foundUser.id };
    }

    async signUp(signUpReqDto: SignUpReqDto): Promise<SignUpResDto> {
        return await this.userService.createUser(signUpReqDto);
    }
}
