import { ConflictException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { GetUserResDto } from './dto/response/get-user.res.dto';
import { plainToInstance } from 'class-transformer';
import { CreateUserReqDto } from './dto/request/create-user.req.dto';
import { CreateUserResDto } from './dto/response/create-user.res.dto';
import { UpdateUserReqDto } from './dto/request/update-user.req.dto';
import { UserRepository } from './user.repository';
import { USER_CONFLICT_ERROR_MESSAGE, USER_NOT_FOUND_ERROR_MESSAGE, USER_SERVICE } from './constants/user.constant';
import { ProviderOptionsType } from './types/provider-options';

@Injectable()
export class UserService {
    private readonly logger = new Logger(USER_SERVICE);

    constructor(
        private readonly userRepository: UserRepository,
    ) {}

    async getUsers(): Promise<GetUserResDto[]> {
        const foundUsers = await this.userRepository.getUsers();
        return foundUsers.map(foundUser => plainToInstance(GetUserResDto, foundUser));
    }

    async getUser(userId: number): Promise<GetUserResDto> {
        const foundUser = await this.userRepository.getUserById(userId);
        if (!foundUser) {
            throw new NotFoundException(USER_NOT_FOUND_ERROR_MESSAGE);
        }
        return plainToInstance(GetUserResDto, foundUser);
    }

    async getUserOauth(providerOptions: ProviderOptionsType): Promise<GetUserResDto> {
        const foundUser = await this.userRepository.getUserByProviderOptions(providerOptions);
        return plainToInstance(GetUserResDto, foundUser);
    }

    async getRefreshToken(userId: number): Promise<string> {
        const foundUser = await this.userRepository.getUserById(userId);
        return foundUser.refreshToken;
    }

    async createUser(createUserReqDto: CreateUserReqDto): Promise<CreateUserResDto> {
        const foundUser = await this.userRepository.getUserByEmail(createUserReqDto.email);
        if (foundUser) {
            throw new ConflictException(USER_CONFLICT_ERROR_MESSAGE);
        }
        const hashedPassword = await bcrypt.hash(createUserReqDto.password, 10);
        createUserReqDto.password = hashedPassword;
        const createdUser = await this.userRepository.createUser(createUserReqDto);
        return plainToInstance(CreateUserResDto, createdUser);
    }

    async updateUser({ 
        updateUserReqDto, 
        userId 
    }: { 
        updateUserReqDto: UpdateUserReqDto;
        userId: number; 
    }): Promise<void> {
        const foundUser = await this.userRepository.getUserById(userId);
        if (!foundUser) {
            throw new NotFoundException(USER_NOT_FOUND_ERROR_MESSAGE);
        }
        const foundEmail = await this.userRepository.getUserByEmail(updateUserReqDto.email);
        if (foundEmail && foundEmail.id !== userId) {
            throw new ConflictException(USER_CONFLICT_ERROR_MESSAGE);
        }
        return await this.userRepository.updateUser({ updateUserReqDto, userId });
    }

    async deleteUser(userId: number): Promise<void> {
        const foundUser = await this.userRepository.getUserById(userId);
        if (!foundUser) {
            throw new NotFoundException(USER_NOT_FOUND_ERROR_MESSAGE)
        }
        return await this.userRepository.deleteUser(userId);
    }

    async createRefresh(data: {
        userId: number;
        refreshToken: string;
    }): Promise<void> {
        await this.userRepository.updateUserCreateRefresh(data);
        return;
    }

    async deleteRefresh(userId: number): Promise<void> {
        await this.userRepository.updateUserDeleteRefresh(userId);
        return;
    } 
}

