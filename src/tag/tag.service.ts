import { Inject, Injectable, Logger } from '@nestjs/common';
import { TagRepository } from './tag.repository';
import { PostTagRepository } from './post-tag.repository';
import { ONE_HOUR_BY_SECOND, REDIS_POSTS, REDIS_TAGS } from '@_/redis/constants/redis.constant';
import { Redis } from 'ioredis';
import { Prisma } from '@prisma/client';

@Injectable()
export class TagService {
  private readonly logger = new Logger(TagService.name);

  constructor(
    private readonly tagRepository: TagRepository,
    private readonly postTagRepository: PostTagRepository,
    @Inject('REDIS-CLIENT')
    private readonly redisClient: Redis,
  ) {}

  async getTagsByPostId(postId: number): Promise<string[]> {
    const tagsKey = [REDIS_POSTS, postId, REDIS_TAGS].join(':');

    const redisTags = await this.redisClient.get(tagsKey);
    if (redisTags) {
      return JSON.parse(redisTags);
    }

    const foundRelations = await this.postTagRepository.findRelationsByPostId(postId);
    const foundTagIds = foundRelations.map((relation) => relation.tagId);
    const foundTags = await this.tagRepository.findTags(foundTagIds);
    const foundTagNames = foundTags.map((tag) => tag.name);

    await this.redisClient.set(tagsKey, JSON.stringify(foundTagNames), 'EX', ONE_HOUR_BY_SECOND);
    return foundTagNames;
  }

  async createTags(
    tx: Prisma.TransactionClient,
    {
      tags,
      postId,
    }: {
      tags: string[];
      postId: number;
    },
  ): Promise<void> {
    const tagIds = [];
    const restTags = [];

    for (const tag of tags) {
      const foundTag = await this.tagRepository.findTagByName(tx, tag);
      if (foundTag) {
        tagIds.push(foundTag.id);
      } else {
        restTags.push(tag);
      }
    }

    for (const tag of restTags) {
      const createdTag = await this.tagRepository.createTagByName(tx, tag);
      tagIds.push(createdTag.id);
    }

    const relations = tagIds.map((tagId) => ({ tagId, postId }));
    await this.postTagRepository.createRelations(tx, relations);

    // 레디스 write through
    const tagsKey = [REDIS_POSTS, postId, REDIS_TAGS].join(':');
    await this.redisClient.set(tagsKey, JSON.stringify(tags), 'EX', ONE_HOUR_BY_SECOND);

    return;
  }

  async updateTags(
    tx: Prisma.TransactionClient,
    {
      tags,
      postId,
    }: {
      tags: string[];
      postId: number;
    },
  ): Promise<void> {
    await this.deleteTags(tx, postId);
    if (!tags || tags.length === 0) {
      return;
    }
    await this.createTags(tx, { tags, postId });
    return;
  }

  async deleteTags(tx: Prisma.TransactionClient, postId: number): Promise<void> {
    const tagsKey = [REDIS_POSTS, postId, REDIS_TAGS].join(':');
    await this.redisClient.del(tagsKey);
    await this.postTagRepository.deleteRelationsByPostId(tx, postId);
    return;
  }
}
