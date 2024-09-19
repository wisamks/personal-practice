import { PrismaService } from "@_/prisma/prisma.service";
import { Injectable, Logger } from "@nestjs/common";
import { Prisma, User } from "@prisma/client";
import { IProviderOptions } from "./types/provider-options.interface";
import { RepositoryBadGatewayException } from "@_/common/custom-error.util";

@Injectable()
export class UserRepository {
    private readonly logger = new Logger(UserRepository.name);
    
    constructor(
        private readonly prismaService: PrismaService,
    ) {}

    async findUsers(): Promise<User[]> {
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
            throw new RepositoryBadGatewayException(err.meesage);
        }
    }

    async findUserById(userId: number): Promise<User> {
        const where = {
            id: userId,
            deletedAt: null,
        };
        try {
            return await this.prismaService.user.findUnique({ where });
        } catch(err) {
            this.logger.error(err);
            throw new RepositoryBadGatewayException(err.meesage);
        }
    }

    async findUserByEmail(email: string): Promise<User> {
        const where = {
            email,
            deletedAt: null,
        };
        try {
            return await this.prismaService.user.findFirst({ where });
        } catch(err) {
            this.logger.error(err);
            throw new RepositoryBadGatewayException(err);
        }
    }

    async findUserByProviderOptions(providerOptions: IProviderOptions): Promise<User> {
        const where = {
            ...providerOptions,
            deletedAt: null,
        };
        try {
            return await this.prismaService.user.findFirst({ where });
        } catch(err) {
            this.logger.error(err);
            throw new RepositoryBadGatewayException(err.meesage);
        }
    }
    
    async createUser(data: Prisma.UserCreateInput): Promise<Pick<User, 'id'>> {
        try {
            const createdResult = await this.prismaService.user.create({ data });
            return { id: createdResult.id };
        } catch(err) {
            this.logger.error(err);
            throw new RepositoryBadGatewayException(err.meesage);
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
            throw new RepositoryBadGatewayException(err.meesage);
        }
    }

    async updateUserCreateRefresh({ userId, refreshToken }: {
        userId: number,
        refreshToken: string,
    }): Promise<void> {
        const where = {
            id: userId,
            deletedAt: null,
        };
        const data = {
            refreshToken
        };
        try {
            await this.prismaService.user.update({ where, data });
            return;
        } catch(err) {
            this.logger.error(err);
            throw new RepositoryBadGatewayException(err.meesage);
        }
    }

    async updateUserDeleteRefresh(userId: number): Promise<void> {
        const where = {
            id: userId,
            deletedAt: null,
        };
        try {
            await this.prismaService.user.update({ where, data: {
                refreshToken: null,
            }});
            return;
        } catch(err) {
            this.logger.error(err);
            throw new RepositoryBadGatewayException(err.meesage);
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
            throw new RepositoryBadGatewayException(err.meesage);
        }
    }
}