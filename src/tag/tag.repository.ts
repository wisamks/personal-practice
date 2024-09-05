import { Injectable, InternalServerErrorException, Logger } from "@nestjs/common";
import { DataSource, Repository } from "typeorm";
import { Tag } from "./tag.entity";
import { CreateTagsReqType } from "./constant/create-tags.req.constant";

@Injectable()
export class TagRepository extends Repository<Tag> {
    private readonly logger = new Logger('TagRepository');

    constructor(
        private readonly dataSource: DataSource
    ) {
        super(Tag, dataSource.createEntityManager())
    }

    async getTagsByPostId(postId: number): Promise<Tag[]> {
        try {
            const foundTags = await this.find({
                where: { postId }
            });
            return foundTags
        } catch(err) {
            this.logger.error(err);
            throw new InternalServerErrorException(err.message);
        }
    }

    async createTags(postTags: CreateTagsReqType[]): Promise<void> {
        try {
            await this.insert(postTags);
            return;
        } catch(err) {
            this.logger.error(err);
            throw new InternalServerErrorException(err.message);
        }
    }

    async deleteTagsByPostId(postId: number): Promise<void> {
        try {
            await this.delete(postId);
        } catch(err) {
            this.logger.error(err);
            throw new InternalServerErrorException(err.message);
        }
    }
}