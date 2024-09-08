import { Injectable, Logger } from "@nestjs/common";
import { TagRepository } from "./tag.repository";
import { PostTagRepository } from "./post-tag.repository";
import { TAG_SERVICE } from "./constants/tag.constant";

@Injectable()
export class TagService {
    private readonly logger = new Logger(TAG_SERVICE);

    constructor(
        private readonly tagRepository: TagRepository,
        private readonly postTagRepository: PostTagRepository,
    ) {}

    async getTagsByPostId(postId: number): Promise<string[]> {
        const foundRelations = await this.postTagRepository.getRelationsByPostId(postId);
        const foundTags = [];
        for (const relation of foundRelations) {
            const foundTag = await this.tagRepository.getTag(relation.tagId);
            foundTags.push(foundTag.name);
        }
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
        return;
    }

    async deleteTags(tx: any, postId: number): Promise<void> {
        return await this.postTagRepository.deleteRelationsByPostId(tx, postId);
    }
}