import { Injectable, Logger } from '@nestjs/common';
import { UserRepository } from './user.repository';
import { CreateUserReqDto } from './dto/create-user.req.dto';
import { CreateUserResDto } from './dto/create-user.res.dto';
import { plainToInstance } from 'class-transformer';
import { GetUserResDto } from './dto/get-user.res.dto';
import { UpdateUserReqDto } from './dto/update-user.req.dto';

@Injectable()
export class AuthService {
    private readonly logger = new Logger('AuthService');

    constructor(
        private readonly userRepository: UserRepository,
    ) {}

    async getUsers(): Promise<GetUserResDto[]> {
        const foundUsers = await this.userRepository.getUsers();
        return foundUsers.map(foundUser => plainToInstance(GetUserResDto, foundUser));
    }

    async getUser(userId: number): Promise<GetUserResDto> {
        const foundUser = await this.userRepository.getUser(userId);
        return plainToInstance(GetUserResDto, foundUser);
    }

    async createUser(createUserReqDto: CreateUserReqDto): Promise<CreateUserResDto> {
        const createdUser = await this.userRepository.createUser(createUserReqDto);
        return plainToInstance(CreateUserResDto, createdUser);
    }

    async updateUser(updateUserReqDto: UpdateUserReqDto, userId: number): Promise<void> {
        return await this.userRepository.updateUser(updateUserReqDto, userId);
    }

    async deleteUser(userId: number): Promise<void> {
        return await this.userRepository.deleteUser(userId);
    }
}
