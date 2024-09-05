import { Injectable, Logger } from "@nestjs/common";
import { TagRepository } from "./tag.repository";
import { CreateTagsReqType } from "./constant/create-tags.req.constant";

@Injectable()
export class TagService {
    private readonly logger = new Logger('TagService');

    constructor(
        private readonly tagRepository: TagRepository,
    ) {}

    async createTags(postTags: CreateTagsReqType[]): Promise<void> {
        return await this.tagRepository.createTags(postTags);
    }

    async deleteTags(postId: number): Promise<void> {
        return await this.tagRepository.deleteTagsByPostId(postId);
    }
}