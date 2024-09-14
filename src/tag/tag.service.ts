import { Inject, Injectable, Logger } from "@nestjs/common";
import { TagRepository } from "./tag.repository";
import { PostTagRepository } from "./post-tag.repository";
import { ONE_HOUR_BY_SECOND, REDIS_POSTS, REDIS_TAGS } from "@_/redis/constants/redis.constant";
import { Redis } from "ioredis";

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

        const foundRelations = await this.postTagRepository.getRelationsByPostId(postId);
        const foundTags = [];
        for (const relation of foundRelations) {
            const foundTag = await this.tagRepository.getTag(relation.tagId);
            foundTags.push(foundTag.name);
        }
        await this.redisClient.set(tagsKey, JSON.stringify(foundTags), 'EX', ONE_HOUR_BY_SECOND);
        return foundTags;
    }

    async createTags(tx: any, { tags, postId }: {
        tags: string[];
        postId: number;
    }): Promise<void> {
        const tagIds = [];
        const restTags = [];

        for (const tag of tags) {
            const foundTag = await this.tagRepository.getTagByName(tx, tag);
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

        const relations = tagIds.map( tagId => ({ tagId, postId }));
        await this.postTagRepository.createRelations(tx, relations);

        // 레디스 write through
        const tagsKey = [REDIS_POSTS, postId, REDIS_TAGS].join(':');
        await this.redisClient.set(tagsKey, JSON.stringify(tags), 'EX', ONE_HOUR_BY_SECOND);

        return;
    }

    async updateTags(tx: any, { tags, postId }: {
        tags: string[];
        postId: number;
    }): Promise<void> {
        await this.deleteTags(tx, postId);
        if (tags) {
            await this.createTags(tx, { tags, postId });
        }
        return;
    }

    async deleteTags(tx: any, postId: number): Promise<void> {
        const tagsKey = [REDIS_POSTS, postId, REDIS_TAGS].join(':');
        await this.redisClient.del(tagsKey);
        return await this.postTagRepository.deleteRelationsByPostId(tx, postId);
    }
}