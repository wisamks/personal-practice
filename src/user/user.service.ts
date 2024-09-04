import { BadRequestException, ConflictException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { UserRepository } from './user.repository';
import { GetUserResDto } from './dto/get-user.res.dto';
import { plainToInstance } from 'class-transformer';
import { CreateUserReqDto } from './dto/create-user.req.dto';
import { CreateUserResDto } from './dto/create-user.res.dto';
import { UpdateUserReqDto } from './dto/update-user.req.dto';

@Injectable()
export class UserService {
    private readonly logger = new Logger('UserService');

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
            throw new NotFoundException('존재하지 않는 유저입니다.');
        }
        return plainToInstance(GetUserResDto, foundUser);
    }

    async createUser(createUserReqDto: CreateUserReqDto): Promise<CreateUserResDto> {
        const foundUser = await this.userRepository.getUserByEmail(createUserReqDto.email);
        if (foundUser) {
            throw new ConflictException('이미 존재하는 유저입니다.');
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
            throw new NotFoundException('존재하지 않는 유저입니다.');
        }
        return await this.userRepository.updateUser({ updateUserReqDto, userId });
    }

    async deleteUser(userId: number): Promise<void> {
        const foundUser = await this.userRepository.getUserById(userId);
        if (!foundUser) {
            throw new NotFoundException('존재하지 않는 유저입니다.')
        }
        return await this.userRepository.deleteUser(userId);
    }
}

