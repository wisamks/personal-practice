import { PartialType } from "@nestjs/mapped-types";
import { CreatePostReqDto } from "./create-post.req.dto";

export class UpdatePostReqDto extends PartialType(CreatePostReqDto) {}