import { BadRequestException, Injectable, Logger } from "@nestjs/common";
import { SignInReqDto } from "./dto/sign-in.req.dto";
import { UserService } from "@_/user/user.service";
import { UserRepository } from "@_/user/user.repository";
import * as bcrypt from 'bcryptjs';
import { SignUpReqDto } from "./dto/sign-up.req.dto";
import { SignUpResDto } from "./dto/sign-up.res.dto";

@Injectable()
export class AuthService {
    private readonly logger = new Logger('AuthService');

    constructor(
        private readonly userService: UserService,
        private readonly userRepository: UserRepository,
    ) {}

    async signIn(signInReqDto: SignInReqDto) {
        const foundUser = await this.userRepository.getUserByEmail(signInReqDto.email);
        if (!foundUser) {
            throw new BadRequestException('이메일 또는 비밀번호가 일치하지 않습니다.');
        }
        const checkPassword = await bcrypt.compare(signInReqDto.password, foundUser.password);
        if (!checkPassword) {
            throw new BadRequestException('이메일 또는 비밀번호가 일치하지 않습니다.');
        }
        const payload = { userId: foundUser.id };

    }

    async signUp(signUpReqDto: SignUpReqDto): Promise<SignUpResDto> {
        return await this.userService.createUser(signUpReqDto);
    }
}
