import { RepositoryBadGatewayException } from "@_/common/custom-error.util";
import { PrismaService } from "@_/prisma/prisma.service";
import { transports } from "winston";
import TransportStream from "winston-transport";

export class MysqlTransport extends transports.Console {
    constructor(
        private readonly prismaService: PrismaService,
        options: TransportStream.TransportStreamOptions,
    ) {
        super(options);
    }

    async log(info: any, callback: () => void): Promise<void> {
        const { level, message, timestamp } = info;

        try {
            await this.prismaService.log.create({
                data: {
                    level,
                    message,
                    createdAt: new Date(timestamp),
                }
            });
        } catch(err) {
            console.error(err);
            throw new RepositoryBadGatewayException(err.message);
        }

        callback();
    }
}