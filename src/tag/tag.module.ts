import { Module } from "@nestjs/common";
import { TagRepository } from "./tag.repository";
import { TagService } from "./tag.service";

@Module({
    providers: [TagService, TagRepository],
    exports: [TagService],
})
export class TagModule {}