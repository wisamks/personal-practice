import { OmitType, PartialType } from "@nestjs/mapped-types";
import { CreatePostReqDto } from "./create-post.req.dto";
import { UpdateTagReqDto } from "@_/tag/dto/update-tag.req.dto";

export class UpdatePostReqDto extends PartialType(OmitType(CreatePostReqDto, ['tags'])) {
    tags: UpdateTagReqDto[]
}