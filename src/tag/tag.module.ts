import { Module } from "@nestjs/common";
import { TagRepository } from "./tag.repository";
import { TagService } from "./tag.service";
import { PostTagRepository } from "./post-tag.repository";
import { PrismaModule } from "@_/prisma/prisma.module";

@Module({
    imports: [PrismaModule],
    providers: [TagService, TagRepository, PostTagRepository],
    exports: [TagService, TagRepository],
})
export class TagModule {}