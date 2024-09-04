import { Injectable, InternalServerErrorException, Logger, NotFoundException } from "@nestjs/common";
import { DataSource, Repository } from "typeorm";
import { User } from "./user.entity";
import { CreateUserReqDto } from "./dto/create-user.req.dto";
import { plainToInstance } from "class-transformer";
import { UpdateUserReqDto } from "./dto/update-user.req.dto";

@Injectable()
export class UserRepository extends Repository<User> {
    private readonly logger = new Logger('UserRepository');

    constructor(
        private readonly dataSource: DataSource
    ) {
        super(User, dataSource.createEntityManager())
    }

    async getUsers(): Promise<User[]> {
        try {
            const foundUsers = await this.find({
                order: {
                    createdAt: 'DESC',
                }
            });
            return foundUsers;
        } catch(err) {
            throw new InternalServerErrorException(err.message);
        }
    }

    async getUser(userId: number): Promise<User> {
        const foundUser = await this.findOne({
            where: {
                id: userId,
            }
        });
        if (!foundUser) {
            throw new NotFoundException('존재하지 않는 유저입니다.');
        }
        return foundUser;
    }

    async createUser(createUserReqDto: CreateUserReqDto): Promise<User> {
        const createdUser = this.create(createUserReqDto);
        if (!createdUser) {
            throw new InternalServerErrorException('유저 정보 생성에 실패했습니다.');
        }
        try {
            const created = await this.save(createdUser);
            return created;
        } catch(err) {}
    }

    async updateUser(updateUserReqDto: UpdateUserReqDto, userId: number): Promise<void> {
        const foundUser = await this.findOne({
            where: {
                id: userId,
            }
        });
        if (!foundUser) {
            throw new NotFoundException('존재하지 않는 유저입니다.');
        }
        await this.update({ id: userId }, updateUserReqDto);
        return;
    }

    async deleteUser(userId: number): Promise<void> {
        const foundUser = await this.findOne({
            where: {
                id: userId,
            }
        });
        if (!foundUser) {
            throw new NotFoundException('존재하지 않는 유저입니다.');
        }
        await this.softDelete({ id: userId });
        return;
    }
}