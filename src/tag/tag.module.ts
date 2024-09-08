import { Module } from "@nestjs/common";
import { TagRepository } from "./tag.repository";
import { TagService } from "./tag.service";
import { PostTagRepository } from "./post-tag.repository";

@Module({
    imports: [],
    providers: [TagService, TagRepository, PostTagRepository],
    exports: [TagService, TagRepository, PostTagRepository],
})
export class TagModule {}