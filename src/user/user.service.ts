import { Injectable, Logger } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { GetUserResDto } from './dto/response/get-user.res.dto';
import { plainToInstance } from 'class-transformer';
import { CreateUserReqDto } from './dto/request/create-user.req.dto';
import { CreateUserResDto } from './dto/response/create-user.res.dto';
import { UpdateUserReqDto } from './dto/request/update-user.req.dto';
import { UserRepository } from './user.repository';
import { IProviderOptions } from './types/provider-options.interface';
import { UserConflictEmailException, UserInternalServerErrorException, UserNotFoundException } from '@_/common/custom-error.util';

@Injectable()
export class UserService {
    private readonly logger = new Logger(UserService.name);

    constructor(
        private readonly userRepository: UserRepository,
    ) {}

    async getUsers(): Promise<GetUserResDto[]> {
        const foundUsers = await this.userRepository.findUsers();
        return foundUsers.map(foundUser => plainToInstance(GetUserResDto, foundUser));
    }

    async getUser(userId: number): Promise<GetUserResDto> {
        const foundUser = await this.userRepository.findUserById(userId);
        if (!foundUser) {
            throw new UserNotFoundException();
        }
        return plainToInstance(GetUserResDto, foundUser);
    }

    async getUserOauth(providerOptions: IProviderOptions): Promise<GetUserResDto> {
        const foundUser = await this.userRepository.findUserByProviderOptions(providerOptions);
        return plainToInstance(GetUserResDto, foundUser);
    }

    async getRefreshToken(userId: number): Promise<string> {
        const foundUser = await this.userRepository.findUserById(userId);
        return foundUser.refreshToken;
    }

    async createUser(createUserReqDto: CreateUserReqDto): Promise<CreateUserResDto> {
        const foundUser = await this.userRepository.findUserByEmail(createUserReqDto.email);
        if (foundUser) {
            throw new UserConflictEmailException();
        }
        const hashedPassword = await bcrypt.hash(createUserReqDto.password, 10);
        const createUserInputData = {
            ...createUserReqDto,
            password: hashedPassword,
        };
        const createdUser = await this.userRepository.createUser(createUserInputData);
        return plainToInstance(CreateUserResDto, createdUser);
    }

    async updateUser({ 
        updateUserReqDto, 
        userId 
    }: { 
        updateUserReqDto: UpdateUserReqDto;
        userId: number; 
    }): Promise<void> {
        const foundEmail = await this.userRepository.findUserByEmail(updateUserReqDto.email);
        if (foundEmail?.id !== userId) {
            throw new UserConflictEmailException();
        }
        const updatedResult = await this.userRepository.updateUser({ updateUserReqDto, userId });
        if (updatedResult.count) {
            return;
        }
        const foundUser = await this.userRepository.findUserById(userId);
        if (!foundUser) {
            throw new UserNotFoundException();
        }
        throw new UserInternalServerErrorException();
    }

    async deleteUser(userId: number): Promise<void> {
        const deletedResult = await this.userRepository.deleteUser(userId);
        if (deletedResult.count) {
            return;
        }
        const foundUser = await this.userRepository.findUserById(userId);
        if (!foundUser) {
            throw new UserNotFoundException();
        }
        throw new UserInternalServerErrorException();
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

