import { RepositoryBadGatewayException } from '@_/common/custom-error.util';
import { PrismaService } from '@_/prisma/prisma.service';
import { Injectable, Logger } from '@nestjs/common';
import { PostTag, Prisma } from '@prisma/client';

@Injectable()
export class PostTagRepository {
  private readonly logger = new Logger(PostTagRepository.name);

  constructor(private readonly prismaService: PrismaService) {}

  async findRelationsByPostId(postId: number): Promise<PostTag[]> {
    try {
      const foundRelations = await this.prismaService.postTag.findMany({
        where: { postId },
      });
      return foundRelations;
    } catch (err) {
      this.logger.error(err);
      throw new RepositoryBadGatewayException(err.message);
    }
  }

  async createRelations(tx: Prisma.TransactionClient, data: PostTag[]): Promise<Prisma.BatchPayload> {
    try {
      const createdResult = await tx.postTag.createMany({ data });
      return createdResult;
    } catch (err) {
      this.logger.error(err);
      throw new RepositoryBadGatewayException(err.message);
    }
  }

  async deleteRelationsByPostId(tx: Prisma.TransactionClient, postId: number): Promise<Prisma.BatchPayload> {
    const where = {
      postId,
    };
    try {
      const deletedResult = await tx.postTag.deleteMany({ where });
      return deletedResult;
    } catch (err) {
      this.logger.error(err);
      throw new RepositoryBadGatewayException(err.message);
    }
  }
}
