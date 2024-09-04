import { Injectable, InternalServerErrorException, Logger } from "@nestjs/common";
import { DataSource, Repository } from "typeorm";
import { User } from "./user.entity";
import { CreateUserReqDto } from "./dto/create-user.req.dto";
import { UpdateUserReqDto } from "./dto/update-user.req.dto";

@Injectable()
export class UserRepository extends Repository<User> {
    private readonly logger = new Logger('UserRepository');

    constructor(
        private readonly dataSource: DataSource
    ) {
        super(User, dataSource.createEntityManager())
    }

    async getUserByEmail(email: string): Promise<User> {
        try {
            return await this.findOne({
                where: { email }
            });
        } catch(err) {
            this.logger.error(err);
            throw new InternalServerErrorException(err.message);
        }
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

    async getUserById(userId: number): Promise<User> {
        const foundUser = await this.findOne({
            where: {
                id: userId,
            }
        });
        return foundUser;
    }

    async createUser(createUserReqDto: CreateUserReqDto): Promise<Pick<User, 'id'>> {
        try {
            const created = await this.insert(createUserReqDto);
            const createdUser = created.identifiers[0] as Pick<User, 'id'>;
            return createdUser;
        } catch(err) {
            throw new InternalServerErrorException('유저 정보 저장에 실패했습니다.');
        }
    }

    async updateUser({ 
            updateUserReqDto, 
            userId 
        }: { 
            updateUserReqDto: UpdateUserReqDto;
            userId: number; 
        }): Promise<void> {
        const where = {
            id: userId,
        };
        try {
            await this.update(where, updateUserReqDto);
            return;
        } catch(err) {
            this.logger.error(err);
            throw new InternalServerErrorException(err.message);
        }
    }

    async deleteUser(userId: number): Promise<void> {
        const where = {
            id: userId
        };
        try {
            await this.softDelete( where );
            return;
        } catch(err) {
            this.logger.error(err);
            throw new InternalServerErrorException(err.message);
        }
    }
}