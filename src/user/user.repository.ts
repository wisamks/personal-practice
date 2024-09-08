import { PrismaService } from "@_/prisma/prisma.service";
import { Injectable, InternalServerErrorException, Logger } from "@nestjs/common";
import { Prisma, User } from "@prisma/client";
import { USER_REPOSITORY } from "./constants/user.constant";

@Injectable()
export class UserRepository {
    private readonly logger = new Logger(USER_REPOSITORY);
    
    constructor(
        private readonly prismaService: PrismaService,
    ) {}

    async getUsers(): Promise<User[]> {
        const where = {
            deletedAt: null,
        };
        try {
            const foundUsers = await this.prismaService.user.findMany({
                where,
                orderBy: {
                    createdAt: 'desc',
                },
            });
            return foundUsers;
        } catch(err) {
            this.logger.error(err);
            throw new InternalServerErrorException(err.message);
        }
    }

    async getUserById(userId: number): Promise<User> {
        const where = {
            id: userId,
            deletedAt: null,
        };
        try {
            return await this.prismaService.user.findUnique({ where });
        } catch(err) {
            this.logger.error(err);
            throw new InternalServerErrorException(err.message);
        }
    }

    async getUserByEmail(email: string): Promise<User> {
        const where = {
            email,
            deletedAt: null,
        };
        try {
            return await this.prismaService.user.findFirst({ where });
        } catch(err) {
            this.logger.error(err);
            throw new InternalServerErrorException(err.message);
        }
    }
    
    async createUser(data: Prisma.UserCreateInput): Promise<Pick<User, 'id'>> {
        try {
            const createdResult = await this.prismaService.user.create({ data });
            return { id: createdResult.id };
        } catch(err) {
            this.logger.error(err);
            throw new InternalServerErrorException(err.message);
        }
    }

    async updateUser({ updateUserReqDto, userId }: {
        updateUserReqDto: Prisma.UserUpdateInput;
        userId: number;
    }) {
        const where = {
            id: userId,
            deletedAt: null,
        }
        try {
            await this.prismaService.user.update({
                data: updateUserReqDto,
                where,
            });
        } catch(err) {
            this.logger.error(err);
            throw new InternalServerErrorException(err.message);
        }
    }
    
    async deleteUser(userId: number) {
        const where = {
            id: userId,
            deletedAt: null,
        };
        try {
            await this.prismaService.user.update({
                data: {
                    deletedAt: new Date(),
                },
                where,
            });
        } catch(err) {
            this.logger.error(err);
            throw new InternalServerErrorException(err.message);
        }
    }
}